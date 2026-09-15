import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExercicioRow, TreinoRow } from "./dados";
import { hojeDaPessoa } from "./dados";

export type RegistroRow = {
  id: string;
  exercicio_id: string;
  data: string;
  carga_kg: number | null;
  repeticoes: number | null;
  series: number | null;
};

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
function proporProximo(
  exercicio: ExercicioRow,
  ultimo: RegistroRow | null,
): { carga: number | null; reps: number } {
  const degrau = Number(exercicio.incremento_kg);

  if (!ultimo) {
    return { carga: null, reps: exercicio.repeticoes };
  }

  const repsAnteriores = ultimo.repeticoes ?? exercicio.repeticoes;

  if (degrau === 0) {
    return { carga: ultimo.carga_kg, reps: repsAnteriores + 1 };
  }

  const cargaAnterior = ultimo.carga_kg;
  if (cargaAnterior === null) return { carga: null, reps: repsAnteriores };

  return { carga: Number(cargaAnterior) + degrau, reps: repsAnteriores };
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

  const ids = lista.map((e) => e.id);
  let registros: RegistroRow[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("registros_exercicio")
      .select("id, exercicio_id, data, carga_kg, repeticoes, series")
      .eq("usuario_id", usuarioId)
      .in("exercicio_id", ids)
      .order("data", { ascending: false })
      .limit(JANELA_REGISTROS);
    registros = (data ?? []) as RegistroRow[];
  }

  const itens: ItemSessao[] = lista.map((exercicio) => {
    const doExercicio = registros.filter((r) => r.exercicio_id === exercicio.id);
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
    };
  });

  return { treino: treino as TreinoRow, data: hoje, itens };
}

export type Historico = {
  exercicio: ExercicioRow;
  registros: RegistroRow[];
  primeiro: RegistroRow | null;
  ultimo: RegistroRow | null;
};

/** Todo o histórico de um exercício — é onde mora "o peso que eu comecei". */
export async function buscarHistorico(
  supabase: SupabaseClient,
  usuarioId: string,
  exercicioId: string,
): Promise<Historico | null> {
  const [{ data: exercicio }, { data: registros }] = await Promise.all([
    supabase
      .from("exercicios")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("id", exercicioId)
      .maybeSingle(),
    supabase
      .from("registros_exercicio")
      .select("id, exercicio_id, data, carga_kg, repeticoes, series")
      .eq("usuario_id", usuarioId)
      .eq("exercicio_id", exercicioId)
      .order("data", { ascending: false }),
  ]);

  if (!exercicio) return null;

  const linhas = (registros ?? []) as RegistroRow[];
  return {
    exercicio: exercicio as ExercicioRow,
    registros: linhas,
    primeiro: linhas.length ? linhas[linhas.length - 1] : null,
    ultimo: linhas[0] ?? null,
  };
}
