import type { SupabaseClient } from "@supabase/supabase-js";
import {
  maiorCarga,
  mediaDasVariacoes,
  primeiroEUltimos,
  variacaoPercentual,
  type PontoDeCarga,
} from "./progresso";
import {
  agoraNoFuso,
  dataRitual,
  diferencaDias,
  domingoDaSemana,
} from "@/lib/ritual/tempo";
import { calcularComposicao, type Composicao, type Sexo } from "./composicao";

export type Medida = {
  id: string;
  data: string;
  peso_kg: number | null;
  altura_cm: number | null;
  pescoco_cm: number | null;
  cintura_cm: number | null;
  quadril_cm: number | null;
};

/** Uma medida com a conta já feita, quando ela fecha. */
export type MedidaComposta = Medida & { composicao: Composicao | null };

export type CargaEvoluida = {
  movimentoId: string;
  nome: string;
  primeira: number;
  ultima: number;
  treinos: number;
  /** O primeiro treino e os três mais recentes, com a data de cada um. */
  pontos: PontoDeCarga[];
  /** Treinos entre o primeiro e os três últimos, que não aparecem. */
  omitidos: number;
  /** Da primeira carga à última, em por cento. Nula com um treino só. */
  variacao: number | null;
};

/**
 * Um treino da série atual e a progressão dos exercícios dele.
 *
 * O grupo é o treino de **hoje** — Push, Pull, Legs, Full — mas o que vai
 * dentro é o histórico inteiro de cada movimento, inclusive o que foi feito
 * em séries que já não existem. Trocar a série muda as caixas, não apaga o
 * que está dentro delas.
 */
export type GrupoDeProgresso = {
  chave: string;
  titulo: string;
  itens: CargaEvoluida[];
  /** A média da variação dos exercícios que têm mais de um treino. */
  variacaoMedia: number | null;
};

export type Evolucao = {
  hoje: string;
  /** Da mais recente para a mais antiga. */
  medidas: MedidaComposta[];
  /** O perfil, para saber de qual ramo da fórmula estamos falando. */
  sexo: Sexo | null;
  alturaPerfil: number | null;
  pesoInicial: number | null;
  pesoAtual: number | null;
  /** Primeira e última medida em que a conta fechou. */
  composicaoInicial: MedidaComposta | null;
  composicaoAtual: MedidaComposta | null;
  /** Dias desde a última vez que passou a fita. `null` se nunca passou. */
  diasDesdeAMedida: number | null;
  /** Um grupo por treino da série atual, e um no fim para o que saiu dela. */
  progressao: GrupoDeProgresso[];
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
    // `*`: coluna que ainda não existe não pode derrubar a Evolução inteira.
    .select("*")
    .eq("id", usuarioId)
    .maybeSingle();

  const hoje = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));

  const [{ data: medidas }, progressao, { data: sessoes }] =
    await Promise.all([
      supabase
        .from("medidas")
        .select(
          "id, data, peso_kg, altura_cm, pescoco_cm, cintura_cm, quadril_cm",
        )
        .eq("usuario_id", usuarioId)
        .order("data", { ascending: false })
        .limit(60),
      montarProgressao(supabase, usuarioId),
      supabase
        .from("sessoes_treino")
        .select("data")
        .eq("usuario_id", usuarioId)
        .not("fim", "is", null)
        .order("data", { ascending: true }),
    ]);

  const sexo = (usuario?.sexo as Sexo | null) ?? null;
  const alturaPerfil = (usuario?.altura_cm as number | null) ?? null;

  const listaMedidas: MedidaComposta[] = ((medidas ?? []) as Medida[]).map(
    (m) => ({
      ...m,
      composicao: sexo
        ? calcularComposicao(
            {
              sexo,
              alturaCm: Number(m.altura_cm ?? alturaPerfil ?? 0),
              pescocoCm: Number(m.pescoco_cm ?? 0),
              cinturaCm: Number(m.cintura_cm ?? 0),
              quadrilCm: m.quadril_cm !== null ? Number(m.quadril_cm) : null,
            },
            m.peso_kg !== null ? Number(m.peso_kg) : null,
          )
        : null,
    }),
  );

  const comPeso = listaMedidas.filter((m) => m.peso_kg !== null);

  // A lista vem da mais recente para a mais antiga, então o começo é o fim.
  const pesoAtual = comPeso[0]?.peso_kg ?? null;
  const pesoInicial = comPeso[comPeso.length - 1]?.peso_kg ?? null;

  const compostas = listaMedidas.filter((m) => m.composicao !== null);
  const composicaoAtual = compostas[0] ?? null;
  const composicaoInicial = compostas[compostas.length - 1] ?? null;

  // Serve ao aviso de "faz tempo" e ao lembrete semanal: é a distância até
  // a última vez que a fita saiu da gaveta, não até o último peso.
  const ultimaComFita = listaMedidas.find((m) => m.cintura_cm !== null);
  const diasDesdeAMedida = ultimaComFita
    ? diferencaDias(hoje, ultimaComFita.data)
    : null;

  const datasSessoes = (sessoes ?? []).map((s) => s.data as string);
  const semanas = new Set(datasSessoes.map((d) => domingoDaSemana(d)));
  const semanasDesdeOComeco = datasSessoes.length
    ? contarSemanas(domingoDaSemana(datasSessoes[0]), domingoDaSemana(hoje))
    : 0;

  return {
    hoje,
    medidas: listaMedidas,
    sexo,
    alturaPerfil,
    pesoInicial,
    pesoAtual,
    composicaoInicial,
    composicaoAtual,
    diasDesdeAMedida,
    progressao,
    semanasComTreino: semanas.size,
    semanasDesdeOComeco,
  };
}

/**
 * A progressão de cada movimento, agrupada pelos treinos da série atual.
 *
 * Um movimento que está em dois treinos aparece nos dois, com o mesmo
 * histórico. O que tem histórico e não está em nenhum treino de agora vai
 * para "Fora da série atual" — é o supino que saiu nesta série e volta na
 * próxima, e até lá o histórico dele não pode sumir da tela.
 *
 * Aparece quem tem pelo menos um registro com carga. Com um só, não há
 * curva nem "de onde para onde", mas o exercício está lá: numa caixa de
 * treino, faltar exercício pareceria defeito.
 */
async function montarProgressao(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<GrupoDeProgresso[]> {
  const [{ data: treinos }, { data: vagas }, { data: movimentos }, { data: registros }] =
    await Promise.all([
      supabase
        .from("treinos")
        .select("id, nome, ordem")
        .eq("usuario_id", usuarioId)
        .order("ordem", { ascending: true })
        .order("criado_em", { ascending: true }),
      supabase
        .from("exercicios")
        .select("treino_id, movimento_id, ordem, criado_em")
        .eq("usuario_id", usuarioId)
        .order("ordem", { ascending: true })
        .order("criado_em", { ascending: true }),
      supabase.from("movimentos").select("id, nome").eq("usuario_id", usuarioId),
      supabase
        .from("registros_exercicio")
        .select(
          "movimento_id, data, carga_kg, repeticoes, series, repeticoes_serie, cargas_serie",
        )
        .eq("usuario_id", usuarioId)
        .not("carga_kg", "is", null)
        .order("data", { ascending: true }),
    ]);

  // A maior carga do treino, e não `carga_kg`: numa pirâmide `carga_kg` é a
  // primeira série, a mais leve, e uma pirâmide de 40 a 55 kg apareceria
  // aqui como 40.
  const cargasPorMovimento = new Map<string, PontoDeCarga[]>();
  for (const r of registros ?? []) {
    const carga = maiorCarga({
      data: r.data as string,
      carga_kg: r.carga_kg as number | null,
      repeticoes: r.repeticoes as number | null,
      series: r.series as number | null,
      repeticoes_serie: r.repeticoes_serie as number[] | null,
      cargas_serie: r.cargas_serie as number[] | null,
    });
    if (carga === null) continue;
    const id = r.movimento_id as string;
    cargasPorMovimento.set(id, [
      ...(cargasPorMovimento.get(id) ?? []),
      { data: r.data as string, valor: carga },
    ]);
  }

  const nomes = new Map(
    (movimentos ?? []).map((m) => [m.id as string, m.nome as string]),
  );

  const item = (movimentoId: string): CargaEvoluida | null => {
    const todos = cargasPorMovimento.get(movimentoId);
    if (!todos?.length) return null;
    const primeira = todos[0].valor;
    const ultima = todos[todos.length - 1].valor;
    return {
      movimentoId,
      nome: nomes.get(movimentoId) ?? "Exercício",
      primeira,
      ultima,
      treinos: todos.length,
      ...primeiroEUltimos(todos),
      variacao: todos.length > 1 ? variacaoPercentual(primeira, ultima) : null,
    };
  };

  const grupo = (
    chave: string,
    titulo: string,
    itens: CargaEvoluida[],
  ): GrupoDeProgresso => ({
    chave,
    titulo,
    itens,
    variacaoMedia: mediaDasVariacoes(itens.map((i) => i.variacao)),
  });

  const grupos: GrupoDeProgresso[] = [];
  const naSerieAtual = new Set<string>();

  // Na ordem do treino, e não por quem mudou mais: dentro da caixa do Pull
  // a pessoa procura o exercício onde ele fica no treino.
  for (const treino of treinos ?? []) {
    const itens: CargaEvoluida[] = [];
    for (const vaga of vagas ?? []) {
      if (vaga.treino_id !== treino.id) continue;
      const id = vaga.movimento_id as string;
      naSerieAtual.add(id);
      if (itens.some((i) => i.movimentoId === id)) continue;
      const pronto = item(id);
      if (pronto) itens.push(pronto);
    }
    if (itens.length > 0) {
      grupos.push(grupo(treino.id as string, treino.nome as string, itens));
    }
  }

  const fora = [...cargasPorMovimento.keys()]
    .filter((id) => !naSerieAtual.has(id))
    .map(item)
    .filter((i): i is CargaEvoluida => i !== null)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  if (fora.length > 0) {
    grupos.push(grupo("fora", "Fora da série atual", fora));
  }

  return grupos;
}

/** Quantos domingos separam duas semanas, contando as duas pontas. */
function contarSemanas(primeiroDomingo: string, domingoAtual: string): number {
  const a = new Date(`${primeiroDomingo}T00:00:00Z`).getTime();
  const b = new Date(`${domingoAtual}T00:00:00Z`).getTime();
  const semana = 7 * 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((b - a) / semana) + 1);
}
