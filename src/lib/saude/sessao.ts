import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExercicioRow, TreinoRow } from "./dados";
import type { GrupoMuscular } from "./catalogo";
import { hojeDaPessoa } from "./dados";
import { cargasDoRegistro, ehVariavel, planoDeReps, quantasSeries } from "./serie";

export type RegistroRow = {
  id: string;
  /** A vaga em que foi feito. Nula quando ela foi apagada depois. */
  exercicio_id: string | null;
  movimento_id: string;
  data: string;
  carga_kg: number | null;
  repeticoes: number | null;
  series: number | null;
  /** O que foi feito em cada série. Nulos = registro de série fixa. */
  repeticoes_serie: number[] | null;
  cargas_serie: number[] | null;
};

/** As colunas de `registros_exercicio`, num lugar só. */
const COLUNAS_REGISTRO =
  "id, exercicio_id, movimento_id, data, carga_kg, repeticoes, series, repeticoes_serie, cargas_serie";

export type ItemSessao = {
  exercicio: ExercicioRow;
  /** A última vez que este exercício foi feito antes de hoje. */
  ultimo: RegistroRow | null;
  /** O que já foi registrado hoje, se já foi. */
  hoje: RegistroRow | null;
  /** Carga proposta para hoje. Nula quando é a primeira vez. */
  propostaCarga: number | null;
  /** Repetições propostas — sobem no lugar da carga quando o degrau é 0. */
  propostaReps: number;
  /** Este exercício tem repetição diferente a cada série. */
  variavel: boolean;
  /** As repetições planejadas, uma por série. */
  planoReps: number[];
  /** A carga proposta para cada série. Nula onde não há de onde partir. */
  propostaCargas: (number | null)[];
};

export type Sessao = {
  treino: TreinoRow;
  data: string;
  itens: ItemSessao[];
};

/**
 * Quantos registros varrer para achar o último de cada exercício.
 *
 * Buscar tudo cresce sem limite; buscar por exercício seria uma ida ao
 * banco por linha da tela. Duzentos cobre meses de treino de qualquer
 * pessoa e cabe numa consulta só.
 */
const JANELA_REGISTROS = 200;

/**
 * O que propor hoje.
 *
 * Degrau zero quer dizer que aquele exercício não tem onde pendurar peso —
 * barra fixa, flexão, prancha. Ali quem sobe é a repetição, e a carga fica
 * como estava.
 */
export function proporProximo(
  exercicio: ExercicioRow,
  ultimo: RegistroRow | null,
): { carga: number | null; reps: number } {
  const degrau = Number(exercicio.incremento_kg);

  if (!ultimo) {
    return { carga: null, reps: exercicio.repeticoes };
  }

  const repsAnteriores = ultimo.repeticoes ?? exercicio.repeticoes;

  if (degrau === 0) {
    // Subir a repetição é a progressão de quem não tem onde pendurar peso —
    // barra fixa, flexão. Com carga registrada, degrau zero quer dizer só
    // "eu cuido da carga": a repetição fica onde estava. Sem isso, um
    // tríceps na corda de 3×10 com 20 kg virava proposta de 3×11.
    const semPeso = ultimo.carga_kg === null || Number(ultimo.carga_kg) === 0;
    return {
      carga: ultimo.carga_kg,
      reps: semPeso ? repsAnteriores + 1 : repsAnteriores,
    };
  }

  const cargaAnterior = ultimo.carga_kg;
  if (cargaAnterior === null) return { carga: null, reps: repsAnteriores };

  return { carga: Number(cargaAnterior) + degrau, reps: repsAnteriores };
}

/**
 * A carga proposta para cada série, num exercício de série variável.
 *
 * Parte do que foi feito naquela série da última vez, e não de uma carga
 * só: numa pirâmide a primeira série e a última não têm o mesmo peso, e
 * propor o mesmo número para as duas seria propor errado nas duas.
 *
 * Registro antigo, sem lista, é lido como a mesma carga em todas as
 * séries — ligar a série variável num exercício com meses de histórico
 * não pode fazer a proposta recomeçar do zero.
 */
function proporPorSerie(
  exercicio: ExercicioRow,
  ultimo: RegistroRow | null,
): (number | null)[] {
  const quantas = quantasSeries(exercicio);
  const degrau = Number(exercicio.incremento_kg);
  const anteriores = cargasDoRegistro(ultimo, quantas);

  return anteriores.map((carga) =>
    carga === null ? null : carga + degrau,
  );
}

export async function buscarSessao(
  supabase: SupabaseClient,
  usuarioId: string,
  treinoId: string,
): Promise<Sessao | null> {
  const [{ data: treino }, { data: exercicios }, diaDaPessoa] =
    await Promise.all([
      supabase
        .from("treinos")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("id", treinoId)
        .maybeSingle(),
      supabase
        .from("exercicios")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("treino_id", treinoId)
        .order("ordem", { ascending: true })
        .order("criado_em", { ascending: true }),
      hojeDaPessoa(supabase, usuarioId),
    ]);

  if (!treino) return null;

  const lista = (exercicios ?? []) as ExercicioRow[];
  const hoje = diaDaPessoa.data;

  // Pelo movimento, e não pela vaga: o supino deste treino continua a
  // progressão do supino da série anterior, que já pode nem existir mais.
  const ids = [...new Set(lista.map((e) => e.movimento_id))];
  let registros: RegistroRow[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("registros_exercicio")
      .select(COLUNAS_REGISTRO)
      .eq("usuario_id", usuarioId)
      .in("movimento_id", ids)
      .order("data", { ascending: false })
      .limit(JANELA_REGISTROS);
    registros = (data ?? []) as RegistroRow[];
  }

  const itens: ItemSessao[] = lista.map((exercicio) => {
    const doExercicio = registros.filter(
      (r) => r.movimento_id === exercicio.movimento_id,
    );
    const deHoje = doExercicio.find((r) => r.data === hoje) ?? null;
    // O "último" é o anterior a hoje: registrar de novo no mesmo dia é
    // corrigir o de hoje, não empilhar um segundo.
    const ultimo = doExercicio.find((r) => r.data < hoje) ?? null;
    const proposta = proporProximo(exercicio, ultimo);

    return {
      exercicio,
      ultimo,
      hoje: deHoje,
      propostaCarga: proposta.carga,
      propostaReps: proposta.reps,
      variavel: ehVariavel(exercicio),
      planoReps: planoDeReps(exercicio),
      propostaCargas: proporPorSerie(exercicio, ultimo),
    };
  });

  return { treino: treino as TreinoRow, data: hoje, itens };
}

export type Historico = {
  movimento: { id: string; nome: string; grupo: GrupoMuscular | null };
  /** A vaga mais recente, para ler o plano (séries × repetições). */
  plano: { series: number; repeticoes: number } | null;
  registros: RegistroRow[];
};

/**
 * Todo o histórico de um movimento — é onde mora "o peso que eu comecei".
 *
 * Por movimento, e não por vaga: inclui o que foi feito em treinos que já
 * foram apagados, porque a série mudou. É o ponto inteiro de o histórico
 * morar no exercício.
 */
export async function buscarHistorico(
  supabase: SupabaseClient,
  usuarioId: string,
  movimentoId: string,
): Promise<Historico | null> {
  const [{ data: movimento }, { data: registros }, { data: vagas }] =
    await Promise.all([
      supabase
        .from("movimentos")
        .select("id, nome, grupo")
        .eq("usuario_id", usuarioId)
        .eq("id", movimentoId)
        .maybeSingle(),
      supabase
        .from("registros_exercicio")
        .select(COLUNAS_REGISTRO)
        .eq("usuario_id", usuarioId)
        .eq("movimento_id", movimentoId)
        .order("data", { ascending: false }),
      supabase
        .from("exercicios")
        .select("series, repeticoes")
        .eq("usuario_id", usuarioId)
        .eq("movimento_id", movimentoId)
        .order("criado_em", { ascending: false })
        .limit(1),
    ]);

  if (!movimento) return null;

  const vaga = vagas?.[0];
  return {
    movimento: {
      id: movimento.id as string,
      nome: movimento.nome as string,
      grupo: (movimento.grupo as GrupoMuscular | null) ?? null,
    },
    plano: vaga
      ? { series: Number(vaga.series), repeticoes: Number(vaga.repeticoes) }
      : null,
    registros: (registros ?? []) as RegistroRow[],
  };
}

export type SessaoAberta = {
  id: string;
  treino_id: string;
  data: string;
  inicio: string;
  fim: string | null;
};

/**
 * A sessão em curso, se houver.
 *
 * Existe uma só por vez de propósito: começar um treino sem ter terminado
 * o anterior é quase sempre esquecimento, não intenção — e dois
 * cronômetros correndo ao mesmo tempo não significam nada.
 */
export async function buscarSessaoAberta(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<SessaoAberta | null> {
  const { data } = await supabase
    .from("sessoes_treino")
    .select("id, treino_id, data, inicio, fim")
    .eq("usuario_id", usuarioId)
    .is("fim", null)
    .order("inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SessaoAberta) ?? null;
}

/** As sessões já fechadas de um treino, da mais recente para a mais antiga. */
export async function buscarSessoesDoTreino(
  supabase: SupabaseClient,
  usuarioId: string,
  treinoId: string,
  limite = 8,
): Promise<SessaoAberta[]> {
  const { data } = await supabase
    .from("sessoes_treino")
    .select("id, treino_id, data, inicio, fim")
    .eq("usuario_id", usuarioId)
    .eq("treino_id", treinoId)
    .not("fim", "is", null)
    .order("inicio", { ascending: false })
    .limit(limite);

  return (data ?? []) as SessaoAberta[];
}

/** Duração em segundos entre início e fim (ou agora, se ainda aberta). */
export function duracaoSegundos(sessao: {
  inicio: string;
  fim: string | null;
}): number {
  const inicio = new Date(sessao.inicio).getTime();
  const fim = sessao.fim ? new Date(sessao.fim).getTime() : Date.now();
  return Math.max(0, Math.floor((fim - inicio) / 1000));
}

/** 1h 04min · 47min · 38s — o maior degrau que couber, sem zeros à toa. */
export function formatarDuracao(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;

  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}
