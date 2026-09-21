import type { SupabaseClient } from "@supabase/supabase-js";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { buscarEstadoTodo, diaDaSemana } from "@/lib/todo/dados";
import { buscarTreinos } from "@/lib/saude/dados";
import { calcularGordura, type Sexo } from "@/lib/saude/composicao";
import { montarAgua, metaDeAgua, type Agua } from "@/lib/saude/agua";
import { domingoDaSemana, somarDiasISO } from "@/lib/ritual/tempo";
import { montarSemana, type SemanaEmCurso } from "./semana";
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
  /** A água de hoje, para beber sem sair da Home. */
  agua: Agua;
  /** Os sete dias desta semana, linha por linha. */
  semana: SemanaEmCurso;
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
    // `*` pelo mesmo motivo de `lib/ritual/dados.ts` e da Nutrição: uma
    // coluna que ainda não existe derruba o select inteiro no PostgREST, e
    // aqui isso esvaziaria a primeira tela do app.
    .select("*")
    .eq("id", usuarioId)
    .maybeSingle();

  const hoje = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));
  const diaDeHoje = diaDaSemana(hoje);
  const semanaInicio = domingoDaSemana(hoje);
  const semanaFim = somarDiasISO(semanaInicio, 6);

  const [
    todo,
    treinos,
    { data: medidas },
    { data: diasDaSemana },
    { data: marcacoes },
    { data: sessoes },
    { data: aguaDaSemana },
  ] = await Promise.all([
    buscarEstadoTodo(supabase, usuarioId),
    buscarTreinos(supabase, usuarioId),
    supabase
      .from("medidas")
      .select("data, peso_kg, altura_cm, pescoco_cm, cintura_cm, quadril_cm")
      .eq("usuario_id", usuarioId)
      .order("data", { ascending: false })
      .limit(PONTOS_NA_HOME),
    supabase
      .from("dias")
      .select("data, espelho_feito_em")
      .eq("usuario_id", usuarioId)
      .gte("data", semanaInicio)
      .lte("data", semanaFim),
    supabase
      .from("compromissos_dia")
      .select("compromisso_id, data, feito")
      .eq("usuario_id", usuarioId)
      .gte("data", semanaInicio)
      .lte("data", semanaFim),
    supabase
      .from("sessoes_treino")
      .select("data")
      .eq("usuario_id", usuarioId)
      .not("fim", "is", null)
      .gte("data", semanaInicio)
      .lte("data", semanaFim),
    supabase
      .from("agua")
      .select("data, ml")
      .eq("usuario_id", usuarioId)
      .gte("data", semanaInicio)
      .lte("data", semanaFim),
  ]);

  const doDia = treinos.find((t) => (t.dias_semana ?? []).includes(diaDeHoje));

  const montado = lerMedidas(
    (medidas ?? []) as LinhaMedida[],
    (usuario?.sexo as Sexo | null) ?? null,
    (usuario?.altura_cm as number | null) ?? null,
  );

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
    ...montado,
    agua: montarAgua(
      montado.pesoAtual,
      (usuario?.garrafa_ml as number | null) ?? null,
      Number((aguaDaSemana ?? []).find((a) => a.data === hoje)?.ml ?? 0),
    ),
    // Os inegociáveis saem de `buscarEstadoTodo`, e não de uma consulta
    // própria: é ela que copia os da semana passada na virada do domingo,
    // e uma consulta paralela chegaria antes da cópia — a Home mostraria a
    // semana vazia até alguém recarregar.
    semana: montarSemana({
      hoje,
      desde: (usuario?.criado_em as string | undefined)?.slice(0, 10) ?? hoje,
      dias: (diasDaSemana ?? []) as { data: string; espelho_feito_em: string | null }[],
      compromissos: todo.inegociaveis.flatMap((s) =>
        s.compromisso
          ? [{ id: s.compromisso.id, texto: s.compromisso.texto, ordem: s.ordem }]
          : [],
      ),
      marcacoes: (marcacoes ?? []) as {
        compromisso_id: string;
        data: string;
        feito: boolean | null;
      }[],
      diasDeTreino: [
        ...new Set(treinos.flatMap((t) => t.dias_semana ?? [])),
      ],
      sessoes: (sessoes ?? []) as { data: string }[],
      agua: (aguaDaSemana ?? []) as { data: string; ml: number }[],
      metaAguaMl: usuario?.garrafa_ml ? metaDeAgua(montado.pesoAtual) : 0,
    }),
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
