import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";

export const dynamic = "force-dynamic";

/** Janela de tolerância: o cron roda a cada 30min, então cobre esse passo. */
const TOLERANCIA_MINUTOS = 30;
const FUSO_PADRAO = "UTC";

type Assinante = {
  usuario_id: string;
  endpoint: string;
  chaves: { p256dh: string; auth: string };
};

function minutosDe(horario: string): number {
  const [h, m] = horario.slice(0, 5).split(":").map(Number);
  return h * 60 + (m || 0);
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
    const agora = partes.hora * 60 + partes.minuto;
    const alvo = minutosDe(u.horario_checkin as string);
    const diferenca = agora - alvo;
    return diferenca >= 0 && diferenca < TOLERANCIA_MINUTOS;
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

  const { data: dias } = await supabase
    .from("dias")
    .select("usuario_id, data, linha_do_dia, feito")
    .in("usuario_id", ids);

  const diaDe = new Map(
    (dias ?? [])
      .filter((d) => porUsuario.get(d.usuario_id as string) === d.data)
      .map((d) => [d.usuario_id as string, d]),
  );

  const pendentes = ids.filter((id) => diaDe.get(id)?.feito == null);
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
        url: "/ritual",
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

  return NextResponse.json({
    enviados,
    candidatos: candidatos.length,
    removidas: mortas.length,
  });
}
