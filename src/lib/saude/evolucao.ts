import type { SupabaseClient } from "@supabase/supabase-js";
import { agoraNoFuso, dataRitual, domingoDaSemana } from "@/lib/ritual/tempo";

export type Medida = {
  id: string;
  data: string;
  peso_kg: number | null;
};

export type CargaEvoluida = {
  exercicioId: string;
  nome: string;
  primeira: number;
  ultima: number;
  treinos: number;
};

export type Evolucao = {
  hoje: string;
  medidas: Medida[];
  pesoInicial: number | null;
  pesoAtual: number | null;
  cargas: CargaEvoluida[];
  /** Semanas distintas em que houve pelo menos um treino registrado. */
  semanasComTreino: number;
  /** Semanas desde o primeiro treino, para dar tamanho ao número acima. */
  semanasDesdeOComeco: number;
};

/**
 * "Como eu comecei e como eu estou."
 *
 * Tudo aqui é registro do que aconteceu — primeiro valor, último valor, e
 * quantas vezes. Nenhum número julga: não há meta, percentual de objetivo,
 * faixa de "ideal" nem nota. A diferença entre registro e placar é essa, e
 * é o que faz esta tela caber nas regras do app.
 *
 * Carga que desceu continua aparecendo, com o mesmo peso visual de uma que
 * subiu. Falhar não zera nada, e regredir também não.
 */
export async function buscarEvolucao(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<Evolucao> {
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("fuso")
    .eq("id", usuarioId)
    .maybeSingle();

  const hoje = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));

  const [{ data: medidas }, { data: exercicios }, { data: sessoes }] =
    await Promise.all([
      supabase
        .from("medidas")
        .select("id, data, peso_kg")
        .eq("usuario_id", usuarioId)
        .order("data", { ascending: false })
        .limit(60),
      supabase
        .from("exercicios")
        .select("id, nome")
        .eq("usuario_id", usuarioId),
      supabase
        .from("sessoes_treino")
        .select("data")
        .eq("usuario_id", usuarioId)
        .not("fim", "is", null)
        .order("data", { ascending: true }),
    ]);

  const listaMedidas = (medidas ?? []) as Medida[];
  const comPeso = listaMedidas.filter((m) => m.peso_kg !== null);

  // A lista vem da mais recente para a mais antiga, então o começo é o fim.
  const pesoAtual = comPeso[0]?.peso_kg ?? null;
  const pesoInicial = comPeso[comPeso.length - 1]?.peso_kg ?? null;

  const cargas = await montarCargas(supabase, usuarioId, exercicios ?? []);

  const datasSessoes = (sessoes ?? []).map((s) => s.data as string);
  const semanas = new Set(datasSessoes.map((d) => domingoDaSemana(d)));
  const semanasDesdeOComeco = datasSessoes.length
    ? contarSemanas(domingoDaSemana(datasSessoes[0]), domingoDaSemana(hoje))
    : 0;

  return {
    hoje,
    medidas: listaMedidas,
    pesoInicial,
    pesoAtual,
    cargas,
    semanasComTreino: semanas.size,
    semanasDesdeOComeco,
  };
}

/** Primeira e última carga de cada exercício que tem mais de um registro. */
async function montarCargas(
  supabase: SupabaseClient,
  usuarioId: string,
  exercicios: { id: string; nome: string }[],
): Promise<CargaEvoluida[]> {
  if (exercicios.length === 0) return [];

  const { data: registros } = await supabase
    .from("registros_exercicio")
    .select("exercicio_id, data, carga_kg")
    .eq("usuario_id", usuarioId)
    .not("carga_kg", "is", null)
    .order("data", { ascending: true });

  const porExercicio = new Map<string, { carga: number }[]>();
  for (const r of registros ?? []) {
    const lista = porExercicio.get(r.exercicio_id as string) ?? [];
    lista.push({ carga: Number(r.carga_kg) });
    porExercicio.set(r.exercicio_id as string, lista);
  }

  const nomes = new Map(exercicios.map((e) => [e.id, e.nome]));
  const cargas: CargaEvoluida[] = [];

  for (const [id, lista] of porExercicio) {
    // Com um registro só não há "de onde para onde": isso é o primeiro dia,
    // não evolução. Aparece quando houver o segundo.
    if (lista.length < 2) continue;
    cargas.push({
      exercicioId: id,
      nome: nomes.get(id) ?? "Exercício",
      primeira: lista[0].carga,
      ultima: lista[lista.length - 1].carga,
      treinos: lista.length,
    });
  }

  // Maior variação primeiro, em módulo: o que mais mudou é o que conta a
  // história, tenha subido ou descido.
  return cargas.sort(
    (a, b) =>
      Math.abs(b.ultima - b.primeira) - Math.abs(a.ultima - a.primeira),
  );
}

/** Quantos domingos separam duas semanas, contando as duas pontas. */
function contarSemanas(primeiroDomingo: string, domingoAtual: string): number {
  const a = new Date(`${primeiroDomingo}T00:00:00Z`).getTime();
  const b = new Date(`${domingoAtual}T00:00:00Z`).getTime();
  const semana = 7 * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((b - a) / semana) + 1);
}
