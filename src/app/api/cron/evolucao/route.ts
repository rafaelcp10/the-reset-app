import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  agoraNoFuso,
  dataRitual,
  diaDaSemana,
  diferencaDias,
  somarMesesISO,
} from "@/lib/ritual/tempo";

export const dynamic = "force-dynamic";

/** Mesma janela do check-in: o cron roda de meia em meia hora. */
const TOLERANCIA_MINUTOS = 30;
const FUSO_PADRAO = "UTC";

/**
 * Os dois lembretes da Evolução, de manhã, no fuso de cada pessoa.
 *
 * De manhã porque a fita pede jejum, e porque é o oposto do check-in
 * noturno: as notificações do app nunca se encontram.
 *
 * A fita é semanal e cai no domingo, que é onde a semana vira no app
 * inteiro — a revisão de domingo já mora ali, e medir vira parte do mesmo
 * momento em vez de virar um segundo compromisso.
 *
 * A foto é mensal e não tem dia fixo: conta um mês a partir da última foto.
 * Quem fotografou dia 9 é lembrado dia 9, e quem atrasou duas semanas
 * passa a ser lembrado na data nova — o ciclo segue a pessoa, não o
 * calendário.
 *
 * Quando os dois caem na mesma manhã, sai uma notificação só. Duas seria o
 * app cobrando duas vezes no mesmo minuto.
 */
const HORA_LOCAL = 9;
const DOMINGO = 0;
const DIAS_ATE_MEDIR = 6;
const MESES_ATE_FOTOGRAFAR = 1;

type Assinante = {
  usuario_id: string;
  endpoint: string;
  chaves: { p256dh: string; auth: string };
};

type Pendencia = { fita: boolean; foto: boolean };

function textoDe(pendencia: Pendencia): string {
  if (pendencia.fita && pendencia.foto) {
    return "Fita métrica e uma foto. Cinco minutos.";
  }
  if (pendencia.foto) return "Faz um mês desde a última foto.";
  return "Domingo de fita métrica. Três minutos.";
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
    .select("id, fuso")
    .eq("lembrete_ativo", true);

  // Só quem está nos trinta minutos seguintes às 9h da manhã em casa.
  const candidatos = (usuarios ?? [])
    .map((u) => {
      const partes = agoraNoFuso((u.fuso as string) || FUSO_PADRAO);
      return { id: u.id as string, partes };
    })
    .filter(({ partes }) => {
      const agora = partes.hora * 60 + partes.minuto;
      const diferenca = agora - HORA_LOCAL * 60;
      return diferenca >= 0 && diferenca < TOLERANCIA_MINUTOS;
    });

  if (candidatos.length === 0) {
    return NextResponse.json({ enviados: 0, candidatos: 0 });
  }

  const ids = candidatos.map((c) => c.id);

  const [{ data: medidas }, { data: fotos }] = await Promise.all([
    supabase
      .from("medidas")
      .select("usuario_id, data")
      .in("usuario_id", ids)
      .not("cintura_cm", "is", null)
      .order("data", { ascending: false }),
    supabase
      .from("fotos_evolucao")
      .select("usuario_id, data")
      .in("usuario_id", ids)
      .order("data", { ascending: false }),
  ]);

  const ultimaDe = (linhas: { usuario_id: string; data: string }[] | null) => {
    // As listas já vêm da mais recente para a mais antiga, então a primeira
    // de cada pessoa é a que vale.
    const mapa = new Map<string, string>();
    for (const linha of linhas ?? []) {
      if (!mapa.has(linha.usuario_id)) mapa.set(linha.usuario_id, linha.data);
    }
    return mapa;
  };

  const ultimaMedida = ultimaDe(
    medidas as { usuario_id: string; data: string }[] | null,
  );
  const ultimaFoto = ultimaDe(
    fotos as { usuario_id: string; data: string }[] | null,
  );

  /**
   * Nenhum dos dois lembretes tem interruptor próprio: o interruptor é ter
   * medido, ou ter fotografado, alguma vez. Quem nunca abriu a Evolução
   * nunca recebe, e o `lembrete_ativo` geral desliga tudo.
   */
  const pendencias = new Map<string, Pendencia>();

  for (const { id, partes } of candidatos) {
    const hoje = dataRitual(partes);

    const medida = ultimaMedida.get(id);
    const fita =
      diaDaSemana(partes) === DOMINGO &&
      Boolean(medida) &&
      diferencaDias(hoje, medida!) >= DIAS_ATE_MEDIR;

    const foto = ultimaFoto.get(id);
    const fotoDevida =
      Boolean(foto) && hoje >= somarMesesISO(foto!, MESES_ATE_FOTOGRAFAR);

    if (fita || fotoDevida) pendencias.set(id, { fita, foto: fotoDevida });
  }

  if (pendencias.size === 0) {
    return NextResponse.json({ enviados: 0, candidatos: candidatos.length });
  }

  const { data: inscricoes } = await supabase
    .from("inscricoes_push")
    .select("usuario_id, endpoint, chaves")
    .in("usuario_id", [...pendencias.keys()]);

  let enviados = 0;
  const mortas: string[] = [];

  await Promise.all(
    ((inscricoes ?? []) as Assinante[]).map(async (inscricao) => {
      const pendencia = pendencias.get(inscricao.usuario_id);
      if (!pendencia) return;

      const carga = JSON.stringify({
        titulo: "The Reset",
        corpo: textoDe(pendencia),
        url: "/saude/evolucao",
        comAcoes: false,
        // Tag única: se duas chegarem antes de a pessoa olhar o celular, a
        // segunda substitui a primeira em vez de empilhar.
        tag: "evolucao",
      });

      try {
        await webpush.sendNotification(
          { endpoint: inscricao.endpoint, keys: inscricao.chaves },
          carga,
        );
        enviados += 1;
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode;
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
    pendentes: pendencias.size,
    removidas: mortas.length,
  });
}
