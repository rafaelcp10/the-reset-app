import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  agoraNoFuso,
  dataRitual,
  diaDaSemana,
  diferencaDias,
} from "@/lib/ritual/tempo";

export const dynamic = "force-dynamic";

/** Mesma janela do check-in: o cron roda de meia em meia hora. */
const TOLERANCIA_MINUTOS = 30;
const FUSO_PADRAO = "UTC";

/**
 * Domingo de manhã, no fuso de cada pessoa.
 *
 * Domingo porque é onde a semana vira no app inteiro — a revisão da semana
 * já mora ali, e medir vira parte do mesmo momento em vez de virar um
 * segundo compromisso. De manhã porque a medida pede jejum, e porque é o
 * oposto do check-in noturno: as duas notificações nunca se encontram.
 */
const DIA_DA_SEMANA = 0;
const HORA_LOCAL = 9;

/**
 * Só é lembrado quem já passou a fita alguma vez. Não existe interruptor
 * novo para isso de propósito: o interruptor é ter medido. Quem nunca abriu
 * a Evolução nunca recebe, e quem parou de medir para de receber assim que
 * o `lembrete_ativo` geral é desligado.
 */
const DIAS_ATE_LEMBRAR = 6;

type Assinante = {
  usuario_id: string;
  endpoint: string;
  chaves: { p256dh: string; auth: string };
};

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

  const candidatos = (usuarios ?? []).filter((u) => {
    const partes = agoraNoFuso((u.fuso as string) || FUSO_PADRAO);
    if (diaDaSemana(partes) !== DIA_DA_SEMANA) return false;
    const agora = partes.hora * 60 + partes.minuto;
    const diferenca = agora - HORA_LOCAL * 60;
    return diferenca >= 0 && diferenca < TOLERANCIA_MINUTOS;
  });

  if (candidatos.length === 0) {
    return NextResponse.json({ enviados: 0, candidatos: 0 });
  }

  const ids = candidatos.map((u) => u.id as string);

  const { data: medidas } = await supabase
    .from("medidas")
    .select("usuario_id, data")
    .in("usuario_id", ids)
    .not("cintura_cm", "is", null)
    .order("data", { ascending: false });

  // A mais recente de cada pessoa: a lista já vem ordenada, então a
  // primeira que aparece é a que vale.
  const ultima = new Map<string, string>();
  for (const m of medidas ?? []) {
    const id = m.usuario_id as string;
    if (!ultima.has(id)) ultima.set(id, m.data as string);
  }

  const pendentes = candidatos
    .filter((u) => {
      const data = ultima.get(u.id as string);
      if (!data) return false;
      const hoje = dataRitual(agoraNoFuso((u.fuso as string) || FUSO_PADRAO));
      return diferencaDias(hoje, data) >= DIAS_ATE_LEMBRAR;
    })
    .map((u) => u.id as string);

  if (pendentes.length === 0) {
    return NextResponse.json({ enviados: 0, candidatos: candidatos.length });
  }

  const { data: inscricoes } = await supabase
    .from("inscricoes_push")
    .select("usuario_id, endpoint, chaves")
    .in("usuario_id", pendentes);

  const carga = JSON.stringify({
    titulo: "The Reset",
    corpo: "Domingo de fita métrica. Três minutos.",
    url: "/saude/evolucao",
    comAcoes: false,
    tag: "medidas",
  });

  let enviados = 0;
  const mortas: string[] = [];

  await Promise.all(
    ((inscricoes ?? []) as Assinante[]).map(async (inscricao) => {
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
    removidas: mortas.length,
  });
}
