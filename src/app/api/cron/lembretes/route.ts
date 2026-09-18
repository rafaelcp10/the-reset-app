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
import { montarAgua } from "@/lib/saude/agua";

export const dynamic = "force-dynamic";

/** Mesma janela do check-in: o cron roda de meia em meia hora. */
const TOLERANCIA_MINUTOS = 30;
const FUSO_PADRAO = "UTC";

/**
 * Os lembretes da Saúde, no fuso de cada pessoa.
 *
 * **Fita**, semanal, domingo às 9h. Domingo é onde a semana vira no app
 * inteiro — a revisão de domingo já mora ali, e medir vira parte do mesmo
 * momento em vez de virar um segundo compromisso.
 *
 * **Foto**, mensal, às 9h, contando um mês a partir da última foto e não
 * do calendário: quem atrasa duas semanas passa a ser lembrado na data
 * nova, e o ciclo segue a pessoa.
 *
 * **Água**, de três em três horas, das 8h às 20h. É o lembrete mais
 * barulhento que este app já teve — cinco por dia contra o único que
 * existia. Por isso ele para assim que a meta é batida, e por isso nenhum
 * dos três tem interruptor próprio: o interruptor é ter medido, ter
 * fotografado, ter dito o tamanho da garrafa. Quem nunca usou a aba nunca
 * recebe nada.
 *
 * Fita e foto caindo na mesma manhã viram uma notificação só. A água nunca
 * cai às 9h, então não se encontra com elas.
 */
const HORA_DA_MANHA = 9;
const DOMINGO = 0;
const DIAS_ATE_MEDIR = 6;
const MESES_ATE_FOTOGRAFAR = 1;
const HORAS_DE_AGUA = [8, 11, 14, 17, 20];

type Assinante = {
  usuario_id: string;
  endpoint: string;
  chaves: { p256dh: string; auth: string };
};

type Aviso = { corpo: string; url: string; tag: string };

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
    .select("id, fuso, garrafa_ml")
    .eq("lembrete_ativo", true);

  // Quem está dentro dos trinta minutos seguintes a alguma das horas que
  // interessam. Fora delas a rota não toca no banco de novo.
  const candidatos = (usuarios ?? [])
    .map((u) => {
      const partes = agoraNoFuso((u.fuso as string) || FUSO_PADRAO);
      const minutos = partes.hora * 60 + partes.minuto;
      const dentro = (hora: number) => {
        const d = minutos - hora * 60;
        return d >= 0 && d < TOLERANCIA_MINUTOS;
      };
      return {
        id: u.id as string,
        garrafaMl: (u.garrafa_ml as number | null) ?? null,
        hoje: dataRitual(partes),
        manha: dentro(HORA_DA_MANHA),
        domingo: diaDaSemana(partes) === DOMINGO,
        agua: HORAS_DE_AGUA.some(dentro),
      };
    })
    .filter((c) => c.manha || (c.agua && c.garrafaMl !== null));

  if (candidatos.length === 0) {
    return NextResponse.json({ enviados: 0, candidatos: 0 });
  }

  const ids = candidatos.map((c) => c.id);
  const daManha = candidatos.filter((c) => c.manha).map((c) => c.id);
  const daAgua = candidatos.filter((c) => c.agua).map((c) => c.id);
  // Cada fuso tem o seu "hoje": num mesmo instante, dois usuários podem
  // estar em dias diferentes. Buscar sem data traria o histórico inteiro e
  // a conta sairia errada para quem virou o dia primeiro.
  const diasEmJogo = [...new Set(candidatos.map((c) => c.hoje))];

  const [{ data: medidas }, { data: fotos }, { data: aguas }] =
    await Promise.all([
      // Serve a duas perguntas: quando foi a última fita, e qual o peso
      // mais recente — que é o que dá a meta de água.
      supabase
        .from("medidas")
        .select("usuario_id, data, peso_kg, cintura_cm")
        .in("usuario_id", ids)
        .order("data", { ascending: false }),
      daManha.length > 0
        ? supabase
            .from("fotos_evolucao")
            .select("usuario_id, data")
            .in("usuario_id", daManha)
            .order("data", { ascending: false })
        : Promise.resolve({ data: [] as { usuario_id: string; data: string }[] }),
      daAgua.length > 0
        ? supabase
            .from("agua")
            .select("usuario_id, data, ml")
            .in("usuario_id", daAgua)
            .in("data", diasEmJogo)
        : Promise.resolve({
            data: [] as { usuario_id: string; data: string; ml: number }[],
          }),
    ]);

  // As listas já descem no tempo, então a primeira de cada pessoa vale.
  const primeiraDe = <T extends { usuario_id: string }>(
    linhas: T[] | null,
    aceita: (l: T) => boolean = () => true,
  ) => {
    const mapa = new Map<string, T>();
    for (const l of linhas ?? []) {
      if (aceita(l) && !mapa.has(l.usuario_id)) mapa.set(l.usuario_id, l);
    }
    return mapa;
  };

  type LinhaMedida = {
    usuario_id: string;
    data: string;
    peso_kg: number | null;
    cintura_cm: number | null;
  };

  const ultimaFita = primeiraDe(
    (medidas ?? []) as LinhaMedida[],
    (m) => m.cintura_cm !== null,
  );
  const ultimoPeso = primeiraDe(
    (medidas ?? []) as LinhaMedida[],
    (m) => m.peso_kg !== null,
  );
  const ultimaFoto = primeiraDe(
    (fotos ?? []) as { usuario_id: string; data: string }[],
  );

  const bebidoNoDia = new Map<string, number>();
  for (const a of aguas ?? []) {
    bebidoNoDia.set(`${a.usuario_id}|${a.data}`, Number(a.ml ?? 0));
  }

  const avisos = new Map<string, Aviso>();

  for (const c of candidatos) {
    if (c.manha) {
      const fita = ultimaFita.get(c.id);
      const precisaMedir =
        c.domingo &&
        Boolean(fita) &&
        diferencaDias(c.hoje, fita!.data) >= DIAS_ATE_MEDIR;

      const foto = ultimaFoto.get(c.id);
      const precisaFotografar =
        Boolean(foto) &&
        c.hoje >= somarMesesISO(foto!.data, MESES_ATE_FOTOGRAFAR);

      if (precisaMedir || precisaFotografar) {
        avisos.set(c.id, {
          corpo:
            precisaMedir && precisaFotografar
              ? "Fita métrica e uma foto. Cinco minutos."
              : precisaFotografar
                ? "Faz um mês desde a última foto."
                : "Domingo de fita métrica. Três minutos.",
          url: "/saude/evolucao",
          tag: "evolucao",
        });
        continue;
      }
    }

    if (!c.agua || c.garrafaMl === null) continue;

    const peso = ultimoPeso.get(c.id)?.peso_kg;
    if (peso == null) continue;

    const estado = montarAgua(
      Number(peso),
      c.garrafaMl,
      bebidoNoDia.get(`${c.id}|${c.hoje}`) ?? 0,
    );

    // Batida a meta, o lembrete cala pelo resto do dia. Cinco cobranças
    // para quem já bebeu tudo é o caminho mais curto para a pessoa
    // desligar a notificação inteira do app.
    if (estado.metaMl === 0 || estado.completou) continue;

    avisos.set(c.id, {
      corpo:
        estado.faltamGarrafas === 1
          ? "Falta uma garrafa de água hoje."
          : `Faltam ${estado.faltamGarrafas} garrafas de água hoje.`,
      url: "/saude/nutricao",
      tag: "agua",
    });
  }

  if (avisos.size === 0) {
    return NextResponse.json({ enviados: 0, candidatos: candidatos.length });
  }

  const { data: inscricoes } = await supabase
    .from("inscricoes_push")
    .select("usuario_id, endpoint, chaves")
    .in("usuario_id", [...avisos.keys()]);

  let enviados = 0;
  const mortas: string[] = [];

  await Promise.all(
    ((inscricoes ?? []) as Assinante[]).map(async (inscricao) => {
      const aviso = avisos.get(inscricao.usuario_id);
      if (!aviso) return;

      const carga = JSON.stringify({
        titulo: "The Reset",
        corpo: aviso.corpo,
        url: aviso.url,
        comAcoes: false,
        // Tag por assunto: uma água nova substitui a água anterior que não
        // foi vista, em vez de empilhar cinco banners na tela de bloqueio.
        tag: aviso.tag,
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
    avisos: avisos.size,
    removidas: mortas.length,
  });
}
