import type { SupabaseClient } from "@supabase/supabase-js";
import { ROTULO_GRUPO, type GrupoMuscular } from "./catalogo";
import {
  maiorCarga,
  mediaDasVariacoes,
  primeiroEUltimos,
  repeticoesDoRegistro,
  variacaoPercentual,
  type PontoDeCarga,
} from "./progresso";
import { cargasDoRegistro, kg, planoDeReps, resumoDeReps } from "./serie";
import { fimDeVerdade } from "./sessao";
import { domingoDaSemana, somarMesesISO } from "@/lib/ritual/tempo";

/**
 * O relatório do mês: o que aconteceu, e o que fazer a partir daí.
 *
 * Tudo aqui é conta sobre o que foi registrado, e a comparação é sempre
 * da pessoa com ela mesma — o mês anterior dela, a sessão anterior dela.
 *
 * **As dicas são a exceção aberta em 2026-10-29** (ver CLAUDE.md, "Dicas
 * de treinador no relatório"): o app passa a sugerir método de treino,
 * mas só aqui, sempre dizendo primeiro o que aconteceu, sem citar ciência,
 * sem elogio e sem cobrança. As regras de cada dica estão escritas abaixo,
 * com o número em que se baseiam, e são convenção de academia — não
 * resultado de pesquisa.
 */

export type Registro = {
  movimento_id: string;
  data: string;
  criado_em: string;
  carga_kg: number | null;
  repeticoes: number | null;
  series: number | null;
  repeticoes_serie: number[] | null;
  cargas_serie: number[] | null;
};

export type Sessao = { data: string; inicio: string; fim: string | null };

export type MovimentoDoRelatorio = {
  id: string;
  nome: string;
  grupo: string | null;
  incremento_kg: number | null;
  series: number | null;
  repeticoes: number | null;
  repeticoes_serie: number[] | null;
};

export type DadosDoRelatorio = {
  /** "2026-10" */
  mes: string;
  hoje: string;
  /** Do primeiro dia do mês anterior ao último dia deste. */
  sessoes: Sessao[];
  /** Todo o histórico até o fim do mês: as dicas olham as últimas sessões. */
  registros: Registro[];
  movimentos: MovimentoDoRelatorio[];
  treinos: { id: string; nome: string }[];
  vagas: { treino_id: string; movimento_id: string }[];
  minutosDoPerfil: number | null;
};

export type Resumo = {
  treinos: number;
  semanas: number;
  minutos: number;
  series: number;
  volume: number;
};

export type ExercicioNoMes = {
  movimentoId: string;
  nome: string;
  sessoes: number;
  primeira: number;
  ultima: number;
  variacao: number | null;
  pontos: PontoDeCarga[];
  omitidos: number;
};

export type TipoDeDica = "travado" | "repeticoes_subindo" | "desceu" | "sem_degrau";

export type Dica = {
  movimentoId: string;
  nome: string;
  tipo: TipoDeDica;
  /** O que aconteceu — sempre vem antes do que fazer. */
  observacao: string;
  sugestao: string;
};

export type Relatorio = {
  mes: string;
  /** O mês ainda não acabou. */
  parcial: boolean;
  resumo: Resumo;
  anterior: Resumo | null;
  dicas: Dica[];
  porTreino: { titulo: string; variacaoMedia: number | null; itens: ExercicioNoMes[] }[];
  grupos: { rotulo: string; series: number }[];
};

/** Quantas sessões iguais seguidas contam como "travou". Convenção de academia. */
const SESSOES_PARA_TRAVAR = 3;
/** Quanto tirar da carga para reconstruir, quando travou. */
const DESCARGA = 0.1;
/** No máximo isto de dicas: dez dicas viram lista de tarefas. */
const MAXIMO_DE_DICAS = 5;

export function limitesDoMes(mes: string): { inicio: string; fim: string } {
  const inicio = `${mes}-01`;
  const fim = somarMesesISO(inicio, 1);
  const [a, m, d] = fim.split("-").map(Number);
  const ultimo = new Date(Date.UTC(a, m - 1, d - 1)).toISOString().slice(0, 10);
  return { inicio, fim: ultimo };
}

export function mesAnterior(mes: string): string {
  return somarMesesISO(`${mes}-01`, -1).slice(0, 7);
}

/**
 * O grupo de um exercício sem grupo, pelo nome.
 *
 * Exercício digitado à mão nasce sem grupo, e o app não tem onde definir:
 * no relatório de outubro de 2026, "Sem grupo" ficava em primeiro, com 101
 * de 303 séries. A ordem importa — "panturrilha no leg press" é
 * panturrilha antes de ser perna, e "elevação lateral" é ombro antes de
 * qualquer "elevação". O que não bater em nada continua sem grupo, em vez
 * de ser chutado.
 */
const PALAVRAS_DO_GRUPO: [GrupoMuscular, string[]][] = [
  ["panturrilha", ["panturrilha", "gemeos"]],
  ["core", ["abdominal", "prancha", "infra", "obliquo"]],
  ["gluteos", ["gluteo", "elevacao pelvica", "hip thrust", "abdutora"]],
  ["ombros", ["elevacao lateral", "elevacao frontal", "desenvolvimento", "militar", "arnold", "face pull"]],
  ["bracos", ["rosca", "triceps", "martelo", "scott", "frances", "biceps"]],
  ["peito", ["supino", "crucifixo", "crossover", "voador", "peck", "flexao"]],
  ["costas", ["remada", "puxada", "pulldown", "barra fixa", "serrote"]],
  ["pernas", ["agachamento", "leg press", "stiff", "flexora", "extensora", "afundo", "hack", "bulgaro", "terra"]],
];

export function grupoPeloNome(nome: string): GrupoMuscular | null {
  const chave = nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  for (const [grupo, palavras] of PALAVRAS_DO_GRUPO) {
    if (palavras.some((p) => chave.includes(p))) return grupo;
  }
  return null;
}

function totalDeRepeticoes(r: Registro): number {
  return repeticoesDoRegistro(r).reduce((s, n) => s + n, 0);
}

function volumeDe(r: Registro): number {
  const reps = repeticoesDoRegistro(r);
  const cargas = cargasDoRegistro(r, reps.length);
  return reps.reduce((s, n, i) => s + n * (cargas[i] ?? 0), 0);
}

/** "4×8" ou "12 · 10 · 8 · 6" — o plano escrito do jeito que a pessoa o vê. */
function planoEscrito(m: MovimentoDoRelatorio): string | null {
  if (!m.series && !m.repeticoes_serie?.length) return null;
  return resumoDeReps(
    planoDeReps({
      series: m.series ?? 3,
      repeticoes: m.repeticoes ?? 10,
      repeticoes_serie: m.repeticoes_serie,
    }),
  );
}

/** Arredonda para o passo do aparelho; sem passo, para o meio quilo. */
function noPasso(valor: number, degrau: number): number {
  const passo = degrau > 0 ? degrau : 0.5;
  return Math.max(passo, Math.round(valor / passo) * passo);
}

function resumir(
  sessoes: Sessao[],
  registros: Registro[],
  todosRegistros: Registro[],
  minutosDoPerfil: number | null,
): Resumo {
  const fechadas = sessoes.filter((s) => s.fim);
  // A duração de cada sessão pela mesma regra do encerramento: treino
  // esquecido aberto conta até a última série, e não até ser fechado. Sem
  // isso, uma sessão de 118 horas dominaria o mês.
  const minutos = fechadas.reduce((soma, s) => {
    const comeco = Date.parse(s.inicio);
    const fim = Date.parse(s.fim!);
    const series = todosRegistros
      .map((r) => r.criado_em)
      .filter((c) => Date.parse(c) >= comeco && Date.parse(c) <= fim)
      .sort();
    const verdadeiro = fimDeVerdade({
      inicio: s.inicio,
      agora: fim,
      ultimaSerie: series[series.length - 1] ?? null,
      minutosDoPerfil,
    });
    return soma + Math.max(0, (Date.parse(verdadeiro) - comeco) / 60_000);
  }, 0);

  return {
    treinos: fechadas.length,
    semanas: new Set(fechadas.map((s) => domingoDaSemana(s.data))).size,
    minutos: Math.round(minutos),
    series: registros.reduce((s, r) => s + repeticoesDoRegistro(r).length, 0),
    volume: Math.round(registros.reduce((s, r) => s + volumeDe(r), 0)),
  };
}

/** As dicas de um movimento, a partir das últimas sessões dele. */
function dicasDe(
  m: MovimentoDoRelatorio,
  historico: Registro[],
  doMes: Registro[],
): Dica[] {
  const dicas: Dica[] = [];
  const degrau = Number(m.incremento_kg ?? 0);
  const comCarga = historico.filter((r) => maiorCarga(r) !== null);
  const nome = m.nome;

  // Degrau zero com carga: o app nunca propõe peso maior. É a dica que
  // depende de configuração, e não de treino.
  if (degrau === 0 && doMes.some((r) => maiorCarga(r) !== null)) {
    dicas.push({
      movimentoId: m.id,
      nome,
      tipo: "sem_degrau",
      observacao: `${nome} está sem degrau: o app nunca propõe uma carga maior.`,
      sugestao:
        "Defina um degrau na tela do treino — 2 kg é o passo comum de halter, 2,5 kg o de barra, 5 kg o de máquina e polia.",
    });
  }

  const ultimas = comCarga.slice(-SESSOES_PARA_TRAVAR);
  if (ultimas.length === SESSOES_PARA_TRAVAR) {
    const cargas = ultimas.map((r) => maiorCarga(r)!);
    const mesmaCarga = cargas.every((c) => c === cargas[0]);
    const repsAntes = totalDeRepeticoes(ultimas[0]);
    const repsAgora = totalDeRepeticoes(ultimas[ultimas.length - 1]);

    if (mesmaCarga && repsAgora <= repsAntes) {
      const leve = noPasso(cargas[0] * (1 - DESCARGA), degrau);
      dicas.push({
        movimentoId: m.id,
        nome,
        tipo: "travado",
        observacao: `${nome} ficou em ${kg(cargas[0])} kg nas últimas ${SESSOES_PARA_TRAVAR} sessões, e as repetições não subiram.`,
        sugestao: `Uma saída comum: baixar para ${kg(leve)} kg por duas sessões e voltar a subir a partir dali. Se continuar travado, trocar por uma variação parecida por algumas semanas.`,
      });
      return dicas;
    }

    if (mesmaCarga && repsAgora > repsAntes) {
      const plano = planoEscrito(m);
      dicas.push({
        movimentoId: m.id,
        nome,
        tipo: "repeticoes_subindo",
        observacao: `${nome} está em ${kg(cargas[0])} kg há ${SESSOES_PARA_TRAVAR} sessões, mas as repetições subiram de ${repsAntes} para ${repsAgora}.`,
        sugestao: `É progressão também. ${
          plano ? `Quando fechar ${plano} em todas as séries` : "Quando fechar as repetições planejadas em todas as séries"
        }, suba ${degrau > 0 ? `${kg(degrau)} kg` : "a carga"}.`,
      });
      return dicas;
    }
  }

  // Desceu dentro do mês, sem ter travado. Pode ser escolha — técnica,
  // dor, cansaço —, e a dica diz isso antes de sugerir qualquer coisa.
  const doMesComCarga = doMes.filter((r) => maiorCarga(r) !== null);
  if (doMesComCarga.length >= 2) {
    const primeira = maiorCarga(doMesComCarga[0])!;
    const ultima = maiorCarga(doMesComCarga[doMesComCarga.length - 1])!;
    if (ultima < primeira) {
      const proxima = Math.min(primeira, ultima + (degrau > 0 ? degrau : 2.5));
      dicas.push({
        movimentoId: m.id,
        nome,
        tipo: "desceu",
        observacao: `${nome} foi de ${kg(primeira)} para ${kg(ultima)} kg neste mês.`,
        sugestao: `Se foi escolha — técnica, dor, cansaço —, siga assim. Se não foi, tente ${kg(proxima)} kg na próxima e retome o degrau a partir dali.`,
      });
    }
  }

  return dicas;
}

const ORDEM_DAS_DICAS: TipoDeDica[] = ["travado", "desceu", "sem_degrau", "repeticoes_subindo"];

export function montarRelatorio(d: DadosDoRelatorio): Relatorio {
  const { inicio, fim } = limitesDoMes(d.mes);
  const anteriorLim = limitesDoMes(mesAnterior(d.mes));
  const noIntervalo = (data: string, a: string, b: string) => data >= a && data <= b;

  const ordenados = [...d.registros].sort((a, b) =>
    a.data < b.data ? -1 : a.data > b.data ? 1 : 0,
  );
  const registrosDoMes = ordenados.filter((r) => noIntervalo(r.data, inicio, fim));
  const registrosDoAnterior = ordenados.filter((r) =>
    noIntervalo(r.data, anteriorLim.inicio, anteriorLim.fim),
  );

  const resumo = resumir(
    d.sessoes.filter((s) => noIntervalo(s.data, inicio, fim)),
    registrosDoMes,
    ordenados,
    d.minutosDoPerfil,
  );
  const sessoesAnteriores = d.sessoes.filter((s) =>
    noIntervalo(s.data, anteriorLim.inicio, anteriorLim.fim),
  );
  const anterior =
    sessoesAnteriores.length > 0 || registrosDoAnterior.length > 0
      ? resumir(sessoesAnteriores, registrosDoAnterior, ordenados, d.minutosDoPerfil)
      : null;

  const movimentos = new Map(d.movimentos.map((m) => [m.id, m]));
  const porMovimento = new Map<string, Registro[]>();
  for (const r of ordenados) {
    porMovimento.set(r.movimento_id, [...(porMovimento.get(r.movimento_id) ?? []), r]);
  }

  // O exercício no mês: os pontos de carga do mês, de onde para onde.
  const noMes = (id: string): ExercicioNoMes | null => {
    const m = movimentos.get(id);
    const doMes = (porMovimento.get(id) ?? []).filter((r) => noIntervalo(r.data, inicio, fim));
    const pontos = doMes
      .map((r) => ({ data: r.data, valor: maiorCarga(r) }))
      .filter((p): p is PontoDeCarga => p.valor !== null);
    if (!m || pontos.length === 0) return null;
    const primeira = pontos[0].valor;
    const ultima = pontos[pontos.length - 1].valor;
    return {
      movimentoId: id,
      nome: m.nome,
      sessoes: pontos.length,
      primeira,
      ultima,
      variacao: pontos.length > 1 ? variacaoPercentual(primeira, ultima) : null,
      ...primeiroEUltimos(pontos),
    };
  };

  // Por treino da série atual, na ordem do treino — como a Progressão da
  // Evolução —, e o que saiu da série numa caixa no fim.
  const porTreino: Relatorio["porTreino"] = [];
  const naSerie = new Set<string>();
  for (const t of d.treinos) {
    const itens: ExercicioNoMes[] = [];
    for (const v of d.vagas.filter((v) => v.treino_id === t.id)) {
      naSerie.add(v.movimento_id);
      if (itens.some((i) => i.movimentoId === v.movimento_id)) continue;
      const item = noMes(v.movimento_id);
      if (item) itens.push(item);
    }
    if (itens.length) {
      porTreino.push({ titulo: t.nome, itens, variacaoMedia: mediaDasVariacoes(itens.map((i) => i.variacao)) });
    }
  }
  const fora = [...new Set(registrosDoMes.map((r) => r.movimento_id))]
    .filter((id) => !naSerie.has(id))
    .map(noMes)
    .filter((i): i is ExercicioNoMes => i !== null);
  if (fora.length) {
    porTreino.push({ titulo: "Fora da série atual", itens: fora, variacaoMedia: mediaDasVariacoes(fora.map((i) => i.variacao)) });
  }

  // Séries por grupo muscular. Sem "pouco" nem "muito": as barras são
  // relativas umas às outras, e quem lê decide.
  const seriesPorGrupo = new Map<string, number>();
  for (const r of registrosDoMes) {
    const m = movimentos.get(r.movimento_id);
    const grupo = m?.grupo ?? (m ? grupoPeloNome(m.nome) : null);
    const rotulo = grupo && grupo in ROTULO_GRUPO ? ROTULO_GRUPO[grupo as GrupoMuscular] : "Sem grupo";
    seriesPorGrupo.set(rotulo, (seriesPorGrupo.get(rotulo) ?? 0) + repeticoesDoRegistro(r).length);
  }
  const grupos = [...seriesPorGrupo.entries()]
    .map(([rotulo, series]) => ({ rotulo, series }))
    .sort((a, b) => b.series - a.series);

  // Dicas só de quem foi treinado neste mês: o que saiu da rotina não
  // precisa de conselho.
  const dicas = [...new Set(registrosDoMes.map((r) => r.movimento_id))]
    .flatMap((id) => {
      const m = movimentos.get(id);
      if (!m) return [];
      const historico = porMovimento.get(id) ?? [];
      return dicasDe(m, historico, historico.filter((r) => noIntervalo(r.data, inicio, fim)));
    })
    .sort((a, b) => ORDEM_DAS_DICAS.indexOf(a.tipo) - ORDEM_DAS_DICAS.indexOf(b.tipo))
    .slice(0, MAXIMO_DE_DICAS);

  return {
    mes: d.mes,
    parcial: d.hoje <= fim,
    resumo,
    anterior,
    dicas,
    porTreino,
    grupos,
  };
}

/** Os dados de um mês, do banco. */
export async function buscarRelatorio(
  supabase: SupabaseClient,
  usuarioId: string,
  mes: string,
  hoje: string,
): Promise<Relatorio> {
  const { fim } = limitesDoMes(mes);
  const inicioAnterior = limitesDoMes(mesAnterior(mes)).inicio;

  const [sessoes, registros, movimentos, treinos, vagas, perfil] = await Promise.all([
    supabase
      .from("sessoes_treino")
      .select("data, inicio, fim")
      .eq("usuario_id", usuarioId)
      .gte("data", inicioAnterior)
      .lte("data", fim),
    supabase
      .from("registros_exercicio")
      .select("movimento_id, data, criado_em, carga_kg, repeticoes, series, repeticoes_serie, cargas_serie")
      .eq("usuario_id", usuarioId)
      .lte("data", fim)
      .order("data", { ascending: true }),
    supabase
      .from("movimentos")
      .select("id, nome, grupo, incremento_kg, series, repeticoes, repeticoes_serie")
      .eq("usuario_id", usuarioId),
    supabase
      .from("treinos")
      .select("id, nome")
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true }),
    supabase
      .from("exercicios")
      .select("treino_id, movimento_id")
      .eq("usuario_id", usuarioId)
      .order("ordem", { ascending: true }),
    supabase.from("usuarios").select("*").eq("id", usuarioId).maybeSingle(),
  ]);

  return montarRelatorio({
    mes,
    hoje,
    sessoes: (sessoes.data ?? []) as Sessao[],
    registros: (registros.data ?? []) as Registro[],
    movimentos: (movimentos.data ?? []) as MovimentoDoRelatorio[],
    treinos: (treinos.data ?? []) as { id: string; nome: string }[],
    vagas: (vagas.data ?? []) as { treino_id: string; movimento_id: string }[],
    minutosDoPerfil: (perfil.data?.treino_minutos as number | null) ?? null,
  });
}
