import type { SupabaseClient } from "@supabase/supabase-js";
import type { CompromissoRow, InegociavelSlot } from "@/lib/ritual/dados";
import { garantirInegociaveisDaSemana } from "@/lib/ritual/inegociaveis";
import {
  agoraNoFuso,
  dataPorExtenso,
  dataRitual,
  domingoDaSemana,
  numeroDaSemana,
  somarDiasISO,
} from "@/lib/ritual/tempo";

export type TipoTarefa = "recorrente" | "semana" | "data";

/** Os três períodos do dia. Nulo é legítimo: nem tudo tem hora. */
export type PeriodoTarefa = "manha" | "tarde" | "noite";

export const PERIODOS: PeriodoTarefa[] = ["manha", "tarde", "noite"];

export const ROTULO_PERIODO: Record<PeriodoTarefa, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

/** O que vem depois dos três, quando existe. */
export const ROTULO_SEM_PERIODO = "A qualquer hora";

const ORDEM_PERIODO: Record<PeriodoTarefa, number> = {
  manha: 0,
  tarde: 1,
  noite: 2,
};

export type TarefaRow = {
  id: string;
  usuario_id: string;
  texto: string;
  tipo: TipoTarefa;
  periodo: PeriodoTarefa | null;
  dias_semana: number[];
  data: string | null;
  puxado_para: string | null;
  criado_em: string;
};

export type TarefaItem = {
  tarefa: TarefaRow;
  feito: boolean;
};

/** Ordena por período e, dentro dele, pela ordem em que foram escritas. */
export function ordenarPorPeriodo(itens: TarefaItem[]): TarefaItem[] {
  return [...itens].sort((a, b) => {
    const pa = a.tarefa.periodo ? ORDEM_PERIODO[a.tarefa.periodo] : 3;
    const pb = b.tarefa.periodo ? ORDEM_PERIODO[b.tarefa.periodo] : 3;
    if (pa !== pb) return pa - pb;
    return a.tarefa.criado_em.localeCompare(b.tarefa.criado_em);
  });
}

export type GrupoPeriodo = {
  periodo: PeriodoTarefa | null;
  rotulo: string;
  itens: TarefaItem[];
};

/**
 * Agrupa por período, pulando os vazios.
 *
 * O grupo sem período vem por último e tem nome próprio: some-lo faria a
 * tarefa desaparecer da tela por não ter hora marcada, que foi o defeito
 * do item recorrente sem dia.
 */
export function agruparPorPeriodo(itens: TarefaItem[]): GrupoPeriodo[] {
  const grupos: GrupoPeriodo[] = PERIODOS.map((periodo) => ({
    periodo,
    rotulo: ROTULO_PERIODO[periodo],
    itens: itens.filter((i) => i.tarefa.periodo === periodo),
  }));

  grupos.push({
    periodo: null,
    rotulo: ROTULO_SEM_PERIODO,
    itens: itens.filter((i) => !i.tarefa.periodo),
  });

  return grupos.filter((g) => g.itens.length > 0);
}

export type EstadoTodo = {
  dataHoje: string;
  dataExtenso: string;
  numeroSemana: number;
  semanaInicio: string;
  inegociaveis: InegociavelSlot[];
  hoje: TarefaItem[];
  semana: TarefaItem[];
};

const FUSO_PADRAO = "UTC";
const SLOTS_INEGOCIAVEIS = [0, 1, 2] as const;

/** Dia da semana (0 = domingo) de um YYYY-MM-DD, sem depender do fuso local. */
export function diaDaSemana(dataISO: string): number {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export async function buscarEstadoTodo(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<EstadoTodo> {
  const { data: usuario } = await supabase
    .from("usuarios")
    // `*` pelo mesmo motivo de `lib/ritual/dados.ts`: coluna que ainda não
    // existe não pode derrubar o select inteiro.
    .select("*")
    .eq("id", usuarioId)
    .maybeSingle();

  const fuso: string = usuario?.fuso || FUSO_PADRAO;
  const criadoEm: string = usuario?.criado_em ?? new Date().toISOString();

  const hoje = dataRitual(agoraNoFuso(fuso));
  const semanaInicio = domingoDaSemana(hoje);

  await garantirInegociaveisDaSemana(
    supabase,
    usuarioId,
    semanaInicio,
    (usuario?.inegociaveis_copiados_para as string | null) ?? null,
  );
  const fimDaSemana = somarDiasISO(semanaInicio, 6);

  const [{ data: tarefasBrutas }, { data: compromissos }] = await Promise.all([
    supabase
      .from("tarefas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .order("criado_em", { ascending: true }),
    supabase
      .from("compromissos")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("semana_inicio", semanaInicio)
      .order("ordem", { ascending: true }),
  ]);

  const tarefas = (tarefasBrutas ?? []) as TarefaRow[];
  const idsComData = tarefas.filter((t) => t.tipo === "data").map((t) => t.id);

  // Marcações da semana corrente cobrem recorrentes e itens "da semana".
  // Os itens com data podem ter sido feitos antes disso, então buscamos o
  // histórico deles à parte — é um conjunto pequeno.
  const [{ data: marcacoesSemana }, { data: marcacoesData }] = await Promise.all([
    supabase
      .from("tarefas_dia")
      .select("tarefa_id, data")
      .eq("usuario_id", usuarioId)
      .gte("data", semanaInicio)
      .lte("data", fimDaSemana),
    idsComData.length > 0
      ? supabase
          .from("tarefas_dia")
          .select("tarefa_id, data")
          .eq("usuario_id", usuarioId)
          .in("tarefa_id", idsComData)
      : Promise.resolve({ data: [] as { tarefa_id: string; data: string }[] }),
  ]);

  const marcadoEm = new Set(
    [...(marcacoesSemana ?? []), ...(marcacoesData ?? [])].map(
      (m) => `${m.tarefa_id}|${m.data}`,
    ),
  );
  const feitoAlgumDia = new Set(
    [...(marcacoesSemana ?? []), ...(marcacoesData ?? [])].map(
      (m) => m.tarefa_id as string,
    ),
  );

  const diaHoje = diaDaSemana(hoje);
  const hojeLista: TarefaItem[] = [];
  const semanaLista: TarefaItem[] = [];

  for (const tarefa of tarefas) {
    const feitoHoje = marcadoEm.has(`${tarefa.id}|${hoje}`);

    if (tarefa.tipo === "recorrente") {
      // Recorrente sem nenhum dia marcado não tem dia em que apareça — e
      // sumia das duas listas de uma vez. Quem acabou de marcar "Recorrente"
      // via o item desaparecer e concluía que não havia onde escolher os
      // dias. Enquanto os dias não vierem, ele espera em "Esta semana".
      if (!tarefa.dias_semana || tarefa.dias_semana.length === 0) {
        semanaLista.push({ tarefa, feito: feitoHoje });
        continue;
      }
      if (tarefa.dias_semana.includes(diaHoje)) {
        hojeLista.push({ tarefa, feito: feitoHoje });
      }
      continue;
    }

    if (tarefa.tipo === "data") {
      // Item com data vencida e não feito rola para hoje, em silêncio.
      const jaFeito = feitoAlgumDia.has(tarefa.id);
      if (jaFeito) {
        if (feitoHoje) hojeLista.push({ tarefa, feito: true });
        continue;
      }
      if (tarefa.data && tarefa.data <= hoje) {
        hojeLista.push({ tarefa, feito: false });
      }
      continue;
    }

    // tipo 'semana': sai da lista quando é feito em qualquer dia da semana.
    const feitoNaSemana = (marcacoesSemana ?? []).some(
      (m) => m.tarefa_id === tarefa.id,
    );
    if (feitoNaSemana) {
      if (feitoHoje) hojeLista.push({ tarefa, feito: true });
      continue;
    }
    if (tarefa.puxado_para === hoje) {
      hojeLista.push({ tarefa, feito: false });
    } else {
      semanaLista.push({ tarefa, feito: false });
    }
  }

  const compromissosPorOrdem = new Map(
    ((compromissos ?? []) as CompromissoRow[]).map((c) => [c.ordem, c]),
  );

  let compromissoDiaPorId = new Map<string, boolean | null>();
  const idsCompromissos = [...compromissosPorOrdem.values()].map((c) => c.id);
  if (idsCompromissos.length > 0) {
    const { data: compromissosDia } = await supabase
      .from("compromissos_dia")
      .select("compromisso_id, feito")
      .eq("data", hoje)
      .in("compromisso_id", idsCompromissos);
    compromissoDiaPorId = new Map(
      (compromissosDia ?? []).map((cd) => [
        cd.compromisso_id as string,
        cd.feito as boolean | null,
      ]),
    );
  }

  const inegociaveis: InegociavelSlot[] = SLOTS_INEGOCIAVEIS.map((ordem) => {
    const compromisso = compromissosPorOrdem.get(ordem) ?? null;
    return {
      ordem,
      compromisso,
      feitoHoje: compromisso
        ? (compromissoDiaPorId.get(compromisso.id) ?? null)
        : null,
    };
  });

  return {
    dataHoje: hoje,
    dataExtenso: dataPorExtenso(hoje),
    numeroSemana: numeroDaSemana(criadoEm, hoje),
    semanaInicio,
    inegociaveis,
    hoje: ordenarPorPeriodo(hojeLista),
    semana: ordenarPorPeriodo(semanaLista),
  };
}

export type GradeMensal = {
  ano: number;
  mes: number;
  rotuloMes: string;
  dias: string[];
  recorrentes: TarefaRow[];
  marcado: Set<string>;
  mesAnterior: { ano: number; mes: number };
  mesSeguinte: { ano: number; mes: number };
};

/** Grade do mês: uma linha por item recorrente, uma coluna por dia. */
export async function buscarGradeMensal(
  supabase: SupabaseClient,
  usuarioId: string,
  ano: number,
  mes: number,
): Promise<GradeMensal> {
  const totalDias = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const dias = Array.from({ length: totalDias }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    return `${ano}-${String(mes).padStart(2, "0")}-${d}`;
  });

  const [{ data: recorrentes }, { data: marcacoes }] = await Promise.all([
    supabase
      .from("tarefas")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("tipo", "recorrente")
      .order("criado_em", { ascending: true }),
    supabase
      .from("tarefas_dia")
      .select("tarefa_id, data")
      .eq("usuario_id", usuarioId)
      .gte("data", dias[0])
      .lte("data", dias[dias.length - 1]),
  ]);

  const nomeMes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(ano, mes - 1, 1)));
  // Só a primeira letra sobe: "Setembro de 2026", não "Setembro De 2026".
  const rotuloMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);

  return {
    ano,
    mes,
    rotuloMes,
    dias,
    recorrentes: (recorrentes ?? []) as TarefaRow[],
    marcado: new Set(
      (marcacoes ?? []).map((m) => `${m.tarefa_id}|${m.data}`),
    ),
    mesAnterior: mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 },
    mesSeguinte: mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 },
  };
}

export async function buscarTarefa(
  supabase: SupabaseClient,
  usuarioId: string,
  id: string,
): Promise<TarefaRow | null> {
  const { data } = await supabase
    .from("tarefas")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("id", id)
    .maybeSingle();
  return (data as TarefaRow) ?? null;
}
