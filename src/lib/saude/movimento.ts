import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * O movimento: o exercício da pessoa, independente de treino.
 *
 * "Supino reto com barra" é um movimento só, esteja em quantos treinos
 * estiver, hoje ou daqui a seis meses. O histórico de carga pertence a ele,
 * e não à vaga que ele ocupa num treino — a série muda a cada três meses,
 * e apagar o treino velho não pode levar o histórico junto.
 *
 * O mesmo movimento é o mesmo nome, sem diferença de maiúscula, acento ou
 * espaço sobrando.
 */

/**
 * A chave do nome. **Precisa bater com `chave_movimento` no banco**
 * (migration `20260930000000_historico_por_exercicio.sql`), que é quem
 * montou os movimentos que já existiam: se as duas contas divergirem, o
 * mesmo supino vira dois movimentos e o histórico se parte ao meio.
 */
export function chaveDoMovimento(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type PlanoDoMovimento = {
  incremento_kg: number | null;
  series: number | null;
  repeticoes: number | null;
  repeticoes_serie: number[] | null;
};

export type Movimento = { id: string; grupo: string | null; plano: PlanoDoMovimento };

/**
 * O movimento com esse nome, criado se ainda não existe.
 *
 * `ignoreDuplicates` e a releitura em seguida, em vez de ler antes e criar
 * depois: dois toques rápidos no mesmo exercício não podem criar dois.
 */
export async function garantirMovimento(
  supabase: SupabaseClient,
  usuarioId: string,
  nome: string,
  grupo: string | null,
): Promise<Movimento | null> {
  const chave = chaveDoMovimento(nome);
  if (!chave) return null;

  await supabase
    .from("movimentos")
    .upsert(
      { usuario_id: usuarioId, nome: nome.trim(), chave, grupo },
      { onConflict: "usuario_id,chave", ignoreDuplicates: true },
    );

  const { data } = await supabase
    .from("movimentos")
    .select("id, grupo, incremento_kg, series, repeticoes, repeticoes_serie")
    .eq("usuario_id", usuarioId)
    .eq("chave", chave)
    .maybeSingle();

  if (!data) return null;
  return {
    id: data.id as string,
    grupo: (data.grupo as string) ?? null,
    plano: {
      incremento_kg: data.incremento_kg === null ? null : Number(data.incremento_kg),
      series: (data.series as number | null) ?? null,
      repeticoes: (data.repeticoes as number | null) ?? null,
      repeticoes_serie: (data.repeticoes_serie as number[] | null) ?? null,
    },
  };
}

/**
 * Guarda no movimento o plano que acabou de ser salvo na vaga.
 *
 * A vaga é descartável — some quando a série muda. O movimento não, e é
 * dele que a próxima vaga do mesmo exercício vai herdar o plano.
 */
export async function guardarPlano(
  supabase: SupabaseClient,
  usuarioId: string,
  movimentoId: string,
  plano: PlanoDoMovimento,
): Promise<void> {
  await supabase
    .from("movimentos")
    .update(plano)
    .eq("usuario_id", usuarioId)
    .eq("id", movimentoId);
}

export type ItemDaBiblioteca = {
  nome: string;
  grupo: string | null;
  /** Quantos treinos registrados ele tem — o que faz valer escolher este. */
  treinos: number;
};

/**
 * Os exercícios que a pessoa já tem, para aparecerem antes do catálogo.
 *
 * É o que liga a série nova à antiga: digitando "sup", o supino dela vem
 * primeiro, com o histórico ao lado. Escolhido ali, a progressão continua;
 * escrito com outro nome, vira outro exercício — e o número de treinos ao
 * lado é o que avisa a diferença antes de ela acontecer.
 */
export async function buscarBiblioteca(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<ItemDaBiblioteca[]> {
  const [{ data: movimentos }, { data: registros }] = await Promise.all([
    supabase
      .from("movimentos")
      .select("id, nome, grupo")
      .eq("usuario_id", usuarioId),
    supabase
      .from("registros_exercicio")
      .select("movimento_id")
      .eq("usuario_id", usuarioId),
  ]);

  const contagem = new Map<string, number>();
  for (const r of registros ?? []) {
    const id = r.movimento_id as string;
    contagem.set(id, (contagem.get(id) ?? 0) + 1);
  }

  return (movimentos ?? []).map((m) => ({
    nome: m.nome as string,
    grupo: (m.grupo as string | null) ?? null,
    treinos: contagem.get(m.id as string) ?? 0,
  }));
}
