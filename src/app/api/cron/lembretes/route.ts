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
import { minutosDesde } from "@/lib/push/janela";

export const dynamic = "force-dynamic";

/**
 * Até quanto tempo depois do horário ainda vale avisar.
 *
 * Eram 30 minutos, do tamanho do passo do cron. Só que o cron do GitHub
 * Actions roda de 2 em 5 horas, não de 30 em 30 minutos, e a janela era
 * perdida quase sempre. Agora a pergunta é "já passou e eu não avisei?".
 *
 * A água tem teto menor que a manhã: um lembrete das 8h chegando às 13h
 * ainda serve, mas o das 20h chegando às 23h não — e a água só faz sentido
 * enquanto o dia ainda dá tempo de beber.
 */
const ATRASO_MAXIMO_MANHA = 180;
const ATRASO_MAXIMO_AGUA = 120;
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
 * Nenhum deles exige pontualidade do cron: cada um pergunta se o horário
 * já passou e se ainda não avisou hoje, e a tabela `lembretes_enviados` é
 * a memória disso. Sem ela, um cron atrasado mandaria a mesma notificação
 * em cada tick até o fim do dia.
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

type Aviso = {
  corpo: string;
  url: string;
  tag: string;
  /** O dia da pessoa, e os tipos a registrar quando o envio der certo. */
  data: string;
  tipos: string[];
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
    .select("id, fuso, garrafa_ml")
    .eq("lembrete_ativo", true);

  // Quem já passou de alguma das horas que interessam, e ainda cabe avisar.
  // Da água, o que vale é o **último** horário vencido: perdidos os das 8h
  // e das 11h, sai um aviso às 14h, e não três de uma vez.
  const candidatos = (usuarios ?? [])
    .map((u) => {
      const partes = agoraNoFuso((u.fuso as string) || FUSO_PADRAO);

      const atrasoManha = minutosDesde(partes, HORA_DA_MANHA);
      const vencidas = HORAS_DE_AGUA.filter(
        (h) => minutosDesde(partes, h) >= 0,
      );
      const ultimaAgua = vencidas.length > 0 ? vencidas[vencidas.length - 1] : null;

      return {
        id: u.id as string,
        garrafaMl: (u.garrafa_ml as number | null) ?? null,
        hoje: dataRitual(partes),
        manha: atrasoManha >= 0 && atrasoManha <= ATRASO_MAXIMO_MANHA,
        domingo: diaDaSemana(partes) === DOMINGO,
        // Os horários vencidos antes do último ficam registrados como
        // avisados mesmo sem aviso: um lembrete de água das 8h entregue às
        // 19h não ajuda ninguém, e reabri-lo depois só empilharia atraso.
        vencidasDeAgua: vencidas,
        ultimaAgua,
        agua:
          ultimaAgua !== null &&
          minutosDesde(partes, ultimaAgua) <= ATRASO_MAXIMO_AGUA,
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

  const [{ data: medidas }, { data: fotos }, { data: aguas }, { data: registros, error: erroRegistros }] =
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
      supabase
        .from("lembretes_enviados")
        .select("usuario_id, data, tipo")
        .in("usuario_id", ids)
        .in("data", diasEmJogo),
    ]);

  // Sem a memória de envios, a lógica nova reenviaria a mesma notificação
  // em cada tick do cron — e a água, cinco vezes por dia, viraria dezenas.
  // Melhor não mandar nada e gritar do que virar spam.
  if (erroRegistros) {
    return NextResponse.json(
      { erro: "lembretes_enviados indisponível", detalhe: erroRegistros.message },
      { status: 503 },
    );
  }

  const jaEnviado = new Set(
    (registros ?? []).map((l) => `${l.usuario_id}|${l.data}|${l.tipo}`),
  );

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
    if (c.manha && !jaEnviado.has(`${c.id}|${c.hoje}|evolucao`)) {
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
          data: c.hoje,
          tipos: ["evolucao"],
        });
        continue;
      }
    }

    if (!c.agua || c.garrafaMl === null || c.ultimaAgua === null) continue;
    if (jaEnviado.has(`${c.id}|${c.hoje}|agua_${c.ultimaAgua}`)) continue;

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
      data: c.hoje,
      // Registra também os horários que passaram sem aviso. Um lembrete
      // das 8h entregue às 19h não ajuda ninguém, e deixá-lo em aberto só
      // faria o próximo tick mandar outro atrasado por cima.
      tipos: c.vencidasDeAgua.map((h) => `agua_${h}`),
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

  // Um registro por pessoa avisada, não por aparelho: quem tem celular e
  // tablet recebe nos dois, e isso continua sendo um aviso só.
  const entregues = new Set(
    ((inscricoes ?? []) as Assinante[])
      .filter((i) => !mortas.includes(i.endpoint))
      .map((i) => i.usuario_id),
  );

  const registrar = [...entregues].flatMap((id) => {
    const aviso = avisos.get(id);
    if (!aviso) return [];
    return aviso.tipos.map((tipo) => ({
      usuario_id: id,
      data: aviso.data,
      tipo,
    }));
  });

  if (registrar.length > 0) {
    await supabase
      .from("lembretes_enviados")
      .upsert(registrar, { onConflict: "usuario_id,data,tipo" });
  }

  return NextResponse.json({
    enviados,
    candidatos: candidatos.length,
    avisos: avisos.size,
    removidas: mortas.length,
  });
}
