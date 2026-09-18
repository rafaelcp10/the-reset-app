import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { passouEAindaCabe } from "@/lib/push/janela";

export const dynamic = "force-dynamic";

/**
 * Até quanto tempo depois do horário ainda vale avisar.
 *
 * Era uma janela de 30 minutos, do tamanho do passo do cron. Só que o cron
 * do GitHub Actions está rodando de 2 em 5 horas, não de 30 em 30 minutos:
 * agendamento lá é "melhor esforço", e intervalo curto é engolido. A janela
 * era perdida quase sempre, e a notificação noturna quase nunca saía.
 *
 * Agora a pergunta é "o horário já passou e eu ainda não avisei?", com teto
 * de três horas. O teto existe para o check-in de 21h30 não virar
 * notificação às 2h da manhã: atrasado demais, o app cala e tenta amanhã.
 */
const ATRASO_MAXIMO_MINUTOS = 180;
const FUSO_PADRAO = "UTC";
const TIPO = "checkin";

type Assinante = {
  usuario_id: string;
  endpoint: string;
  chaves: { p256dh: string; auth: string };
};

function horaEMinuto(horario: string): [number, number] {
  const [h, m] = horario.slice(0, 5).split(":").map(Number);
  return [h, m || 0];
}

export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");
  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const faltando = [
    !process.env.VAPID_PUBLIC_KEY && "VAPID_PUBLIC_KEY",
    !process.env.VAPID_PRIVATE_KEY && "VAPID_PRIVATE_KEY",
    !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (faltando.length > 0) {
    return NextResponse.json(
      { erro: "faltam variáveis de ambiente", faltando },
      { status: 503 },
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contato@thereset.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const supabase = createAdminClient();

  const { data: usuarios } = await supabase
    .from("usuarios")
    .select("id, fuso, horario_checkin, lembrete_ativo")
    .eq("lembrete_ativo", true)
    .not("horario_checkin", "is", null);

  const candidatos = (usuarios ?? []).filter((u) => {
    const partes = agoraNoFuso(u.fuso || FUSO_PADRAO);
    const [hora, minuto] = horaEMinuto(u.horario_checkin as string);
    return passouEAindaCabe(partes, hora, minuto, ATRASO_MAXIMO_MINUTOS);
  });

  if (candidatos.length === 0) {
    return NextResponse.json({ enviados: 0, candidatos: 0 });
  }

  const ids = candidatos.map((u) => u.id);

  // Quem já respondeu hoje não precisa ser lembrado — o app nunca cobra
  // duas vezes (ver CLAUDE.md: falhar não zera nada, e não se insiste).
  const porUsuario = new Map(
    candidatos.map((u) => [
      u.id as string,
      dataRitual(agoraNoFuso((u.fuso as string) || FUSO_PADRAO)),
    ]),
  );

  const [{ data: dias }, { data: jaAvisados, error: erroLembretes }] =
    await Promise.all([
    supabase
      .from("dias")
      .select("usuario_id, data, linha_do_dia, feito")
      .in("usuario_id", ids),
    // Sem esta memória, um cron que roda três vezes depois do horário
    // manda três notificações iguais — que é o preço de não depender mais
    // de uma janela estreita.
    supabase
      .from("lembretes_enviados")
      .select("usuario_id, data")
      .eq("tipo", TIPO)
      .in("usuario_id", ids),
  ]);

  // Sem a memória de envios, a lógica nova reenviaria a mesma notificação
  // em cada tick do cron até o fim do dia. Melhor não mandar nada e gritar
  // do que virar spam — a migration que cria a tabela pode não ter rodado.
  if (erroLembretes) {
    return NextResponse.json(
      { erro: "lembretes_enviados indisponível", detalhe: erroLembretes.message },
      { status: 503 },
    );
  }

  const avisado = new Set(
    (jaAvisados ?? []).map((l) => `${l.usuario_id}|${l.data}`),
  );

  const diaDe = new Map(
    (dias ?? [])
      .filter((d) => porUsuario.get(d.usuario_id as string) === d.data)
      .map((d) => [d.usuario_id as string, d]),
  );

  const pendentes = ids.filter(
    (id) =>
      diaDe.get(id)?.feito == null &&
      !avisado.has(`${id}|${porUsuario.get(id)}`),
  );
  if (pendentes.length === 0) {
    return NextResponse.json({ enviados: 0, candidatos: candidatos.length });
  }

  const { data: inscricoes } = await supabase
    .from("inscricoes_push")
    .select("usuario_id, endpoint, chaves")
    .in("usuario_id", pendentes);

  let enviados = 0;
  const mortas: string[] = [];

  await Promise.all(
    ((inscricoes ?? []) as Assinante[]).map(async (inscricao) => {
      const dia = diaDe.get(inscricao.usuario_id);
      const linha = (dia?.linha_do_dia as string | null) ?? null;

      const carga = JSON.stringify({
        titulo: "The Reset",
        // A notificação carrega a própria linha da pessoa: ela decide sem
        // precisar lembrar o que escreveu de manhã.
        corpo: linha ? `Você disse: ${linha}` : "O que você fez hoje?",
        // Aponta para a seção do check-in, e não para o topo do Ritual:
        // quem toca na notificação quer responder, e à noite a linha do dia
        // é a última seção da tela — abrir no topo custava uma rolagem
        // inteira para chegar onde a promessa dos cinco segundos mora.
        url: "/ritual#linha-do-dia",
        data: porUsuario.get(inscricao.usuario_id) ?? null,
        comAcoes: Boolean(linha),
        tag: "checkin",
      });

      try {
        await webpush.sendNotification(
          {
            endpoint: inscricao.endpoint,
            keys: inscricao.chaves,
          },
          carga,
        );
        enviados += 1;
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode;
        // 404/410: o navegador descartou a inscrição. Limpar evita insistir
        // num aparelho que não existe mais.
        if (status === 404 || status === 410) mortas.push(inscricao.endpoint);
      }
    }),
  );

  if (mortas.length > 0) {
    await supabase.from("inscricoes_push").delete().in("endpoint", mortas);
  }

  // Um registro por pessoa avisada, não por aparelho: quem tem celular e
  // tablet recebe nos dois, e isso continua sendo um aviso só.
  const marcados = [
    ...new Set(
      ((inscricoes ?? []) as Assinante[])
        .filter((i) => !mortas.includes(i.endpoint))
        .map((i) => i.usuario_id),
    ),
  ];

  if (marcados.length > 0) {
    await supabase.from("lembretes_enviados").upsert(
      marcados.map((id) => ({
        usuario_id: id,
        data: porUsuario.get(id)!,
        tipo: TIPO,
      })),
      { onConflict: "usuario_id,data,tipo" },
    );
  }

  return NextResponse.json({
    enviados,
    candidatos: candidatos.length,
    removidas: mortas.length,
  });
}
