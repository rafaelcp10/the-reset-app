import type { SupabaseClient } from "@supabase/supabase-js";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { diaDaSemana } from "@/lib/todo/dados";
import type { GrupoMuscular } from "./catalogo";

export type LocalTreino = "casa" | "academia" | "hibrido";

export const ROTULO_LOCAL: Record<LocalTreino, string> = {
  casa: "Em casa",
  academia: "Academia",
  hibrido: "Os dois",
};

export const LOCAIS: LocalTreino[] = ["casa", "academia", "hibrido"];

/** Onde costuma doer. Não é diagnóstico — é o que evitar carregar. */
export const LIMITACOES = [
  "ombro",
  "joelho",
  "coluna",
  "cotovelo",
  "punho",
  "quadril",
] as const;

export type Limitacao = (typeof LIMITACOES)[number];

export const ROTULO_LIMITACAO: Record<Limitacao, string> = {
  ombro: "Ombro",
  joelho: "Joelho",
  coluna: "Coluna",
  cotovelo: "Cotovelo",
  punho: "Punho",
  quadril: "Quadril",
};

export const MINUTOS = [30, 45, 60, 75, 90] as const;

export type ConfigAcademia = {
  local: LocalTreino | null;
  minutos: number | null;
  limitacoes: string[];
  configurada: boolean;
};

export type TreinoRow = {
  id: string;
  usuario_id: string;
  nome: string;
  dias_semana: number[];
  ordem: number;
  criado_em: string;
};

export type ExercicioRow = {
  id: string;
  usuario_id: string;
  treino_id: string;
  nome: string;
  grupo: GrupoMuscular | null;
  series: number;
  repeticoes: number;
  /** Repetições de cada série. Nulo é "todas iguais a `repeticoes`". */
  repeticoes_serie: number[] | null;
  incremento_kg: number;
  ordem: number;
  criado_em: string;
};

export type TreinoComContagem = TreinoRow & { totalExercicios: number };

export async function buscarConfig(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<ConfigAcademia> {
  const { data } = await supabase
    .from("usuarios")
    .select("treino_local, treino_minutos, treino_limitacoes, academia_configurada_em")
    .eq("id", usuarioId)
    .maybeSingle();

  return {
    local: (data?.treino_local as LocalTreino) ?? null,
    minutos: data?.treino_minutos ?? null,
    limitacoes: (data?.treino_limitacoes as string[]) ?? [],
    configurada: Boolean(data?.academia_configurada_em),
  };
}

/**
 * Os treinos com quantos exercícios cada um tem. A contagem vem aninhada
 * pelo Postgres para não virar uma consulta por treino.
 */
export async function buscarTreinos(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<TreinoComContagem[]> {
  const { data } = await supabase
    .from("treinos")
    .select("*, exercicios(count)")
    .eq("usuario_id", usuarioId)
    .order("ordem", { ascending: true })
    .order("criado_em", { ascending: true });

  type ComContagem = TreinoRow & { exercicios?: { count: number }[] };
  return ((data ?? []) as ComContagem[]).map((linha) => {
    const { exercicios, ...treino } = linha;
    return { ...treino, totalExercicios: exercicios?.[0]?.count ?? 0 };
  });
}

export async function buscarTreino(
  supabase: SupabaseClient,
  usuarioId: string,
  treinoId: string,
): Promise<{ treino: TreinoRow; exercicios: ExercicioRow[] } | null> {
  const [{ data: treino }, { data: exercicios }] = await Promise.all([
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
  ]);

  if (!treino) return null;
  return {
    treino: treino as TreinoRow,
    exercicios: (exercicios ?? []) as ExercicioRow[],
  };
}

/** O dia do ritual (vira às 3h) no fuso da pessoa, e o dia da semana dele. */
export async function hojeDaPessoa(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<{ data: string; diaSemana: number }> {
  const { data } = await supabase
    .from("usuarios")
    .select("fuso")
    .eq("id", usuarioId)
    .maybeSingle();

  const hoje = dataRitual(agoraNoFuso(data?.fuso || "UTC"));
  return { data: hoje, diaSemana: diaDaSemana(hoje) };
}
