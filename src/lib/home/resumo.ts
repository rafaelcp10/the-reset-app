import type { SupabaseClient } from "@supabase/supabase-js";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { buscarEstadoTodo, diaDaSemana } from "@/lib/todo/dados";
import { buscarTreinos } from "@/lib/saude/dados";
import { calcularGordura, type Sexo } from "@/lib/saude/composicao";
import type { Ponto } from "@/components/saude/Grafico";

export type ResumoDoDia = {
  hoje: string;
  /** Tarefas do dia: quantas existem e quantas ainda faltam. */
  tarefas: { total: number; faltam: number };
  /** O treino marcado para hoje, quando existe. */
  treino: { id: string; nome: string; exercicios: number } | null;
  /** Há treino cadastrado, mesmo que hoje não seja dia. */
  temTreinos: boolean;
  /** Últimos pesos, do mais antigo para o mais recente. */
  curvaPeso: Ponto[];
  pesoAtual: number | null;
  gorduraAtual: number | null;
};

/** Quantos pontos bastam para a curva da Home dizer a direção. */
const PONTOS_NA_HOME = 12;

/**
 * O dia inteiro, para a Home.
 *
 * A contagem de tarefas vem de `buscarEstadoTodo`, a mesma função que
 * monta a aba, e não de uma versão enxuta escrita aqui. A regra de "o que
 * cai hoje" tem casos demais — recorrente sem dia marcado, item com data
 * vencida que rola em silêncio, item de semana que sai quando é feito em
 * qualquer dia. Reescrever isso em miniatura garantiria que a Home e o
 * To-do discordassem em algum mês, e um número errado na primeira tela é
 * pior do que uma consulta a mais.
 *
 * Tudo em paralelo: esta é a tela mais visitada do app, e o que cada área
 * devolve é uma linha, não a área inteira.
 */
export async function buscarResumoDoDia(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<ResumoDoDia> {
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("fuso, sexo, altura_cm")
    .eq("id", usuarioId)
    .maybeSingle();

  const hoje = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));
  const diaDeHoje = diaDaSemana(hoje);

  const [todo, treinos, { data: medidas }] = await Promise.all([
    buscarEstadoTodo(supabase, usuarioId),
    buscarTreinos(supabase, usuarioId),
    supabase
      .from("medidas")
      .select("data, peso_kg, altura_cm, pescoco_cm, cintura_cm, quadril_cm")
      .eq("usuario_id", usuarioId)
      .order("data", { ascending: false })
      .limit(PONTOS_NA_HOME),
  ]);

  const doDia = treinos.find((t) => (t.dias_semana ?? []).includes(diaDeHoje));

  return {
    hoje,
    tarefas: {
      total: todo.hoje.length,
      faltam: todo.hoje.filter((i) => !i.feito).length,
    },
    temTreinos: treinos.length > 0,
    treino: doDia
      ? { id: doDia.id, nome: doDia.nome, exercicios: doDia.totalExercicios }
      : null,
    ...lerMedidas(
      (medidas ?? []) as LinhaMedida[],
      (usuario?.sexo as Sexo | null) ?? null,
      (usuario?.altura_cm as number | null) ?? null,
    ),
  };
}

type LinhaMedida = {
  data: string;
  peso_kg: number | null;
  altura_cm: number | null;
  pescoco_cm: number | null;
  cintura_cm: number | null;
  quadril_cm: number | null;
};

function lerMedidas(
  linhas: LinhaMedida[],
  sexo: Sexo | null,
  alturaPerfil: number | null,
): Pick<ResumoDoDia, "curvaPeso" | "pesoAtual" | "gorduraAtual"> {
  const comPeso = linhas.filter((m) => m.peso_kg !== null);

  // A busca desce no tempo; a curva anda para a frente.
  const curvaPeso: Ponto[] = comPeso
    .map((m) => ({ data: m.data, valor: Number(m.peso_kg) }))
    .reverse();

  const recenteComFita = sexo
    ? linhas.find((m) => m.cintura_cm !== null && m.pescoco_cm !== null)
    : undefined;

  const gorduraAtual = recenteComFita
    ? calcularGordura({
        sexo: sexo!,
        alturaCm: Number(recenteComFita.altura_cm ?? alturaPerfil ?? 0),
        pescocoCm: Number(recenteComFita.pescoco_cm),
        cinturaCm: Number(recenteComFita.cintura_cm),
        quadrilCm:
          recenteComFita.quadril_cm !== null
            ? Number(recenteComFita.quadril_cm)
            : null,
      })
    : null;

  return {
    curvaPeso,
    pesoAtual: comPeso[0]?.peso_kg ?? null,
    gorduraAtual,
  };
}
