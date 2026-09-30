import type { Ponto } from "@/components/saude/Grafico";
import { cargasDoRegistro } from "./serie";

/**
 * A progressão de um exercício, treino a treino.
 *
 * Três leituras do mesmo histórico, e nenhuma delas é estimativa: todas
 * são conta sobre o que foi registrado.
 *
 * - **Maior carga** — a série mais pesada de cada treino. É a pergunta que
 *   todo mundo faz primeiro, e numa pirâmide é a última série, não a
 *   primeira: `carga_kg` sozinho guardaria justamente a mais leve.
 * - **Volume** — repetições vezes carga, somadas em todas as séries. É o
 *   que enxerga o treino que ficou mais pesado sem a carga máxima subir:
 *   duas repetições a mais em cada série, uma série a mais.
 * - **Repetições** — para o exercício sem peso nenhum, onde carga e volume
 *   não dizem nada. Barra fixa progride por aqui.
 *
 * O que ficou fora, de propósito: o "1RM estimado" que Strong, Fitbod e
 * Stronglifts põem como número principal. É o palpite de uma fórmula sobre
 * uma série que a pessoa nunca fez, e este app mostra o que aconteceu, não
 * o que uma conta imagina. E recorde com troféu, que é medalha.
 */

export type Metrica = "carga" | "volume" | "repeticoes";

type Registro = {
  data: string;
  carga_kg: number | null;
  repeticoes: number | null;
  series: number | null;
  repeticoes_serie: number[] | null;
  cargas_serie: number[] | null;
};

export type Progresso = {
  carga: Ponto[];
  volume: Ponto[];
  repeticoes: Ponto[];
  /** As que têm o que mostrar, na ordem em que aparecem. */
  metricas: Metrica[];
};

/** As repetições de cada série de um registro, fixo ou variável. */
export function repeticoesDoRegistro(r: Registro): number[] {
  if (r.repeticoes_serie?.length) return r.repeticoes_serie.map(Number);
  const series = r.series ?? 1;
  const reps = r.repeticoes ?? 0;
  return Array.from({ length: series }, () => reps);
}

/** A série mais pesada do treino. Nula quando não houve peso nenhum. */
export function maiorCarga(r: Registro): number | null {
  const reps = repeticoesDoRegistro(r);
  const cargas = cargasDoRegistro(r, Math.max(reps.length, 1)).filter(
    (c): c is number => c !== null && c > 0,
  );
  return cargas.length ? Math.max(...cargas) : null;
}

export function montarProgresso(registros: Registro[]): Progresso {
  const ordenados = [...registros].sort((a, b) =>
    a.data < b.data ? -1 : a.data > b.data ? 1 : 0,
  );

  const carga: Ponto[] = [];
  const volume: Ponto[] = [];
  const repeticoes: Ponto[] = [];

  for (const r of ordenados) {
    const reps = repeticoesDoRegistro(r);
    const cargas = cargasDoRegistro(r, reps.length);

    const maior = maiorCarga(r);
    if (maior !== null) carga.push({ data: r.data, valor: maior });

    const levantado = reps.reduce((soma, n, i) => soma + n * (cargas[i] ?? 0), 0);
    if (levantado > 0) volume.push({ data: r.data, valor: Math.round(levantado) });

    const total = reps.reduce((soma, n) => soma + n, 0);
    if (total > 0) repeticoes.push({ data: r.data, valor: total });
  }

  // Com peso registrado alguma vez, a conversa é carga e volume. Sem peso
  // nunca, é repetição — mostrar "0 kg" numa barra fixa seria mentir.
  const metricas: Metrica[] =
    carga.length > 0 ? ["carga", "volume"] : ["repeticoes"];

  return { carga, volume, repeticoes, metricas };
}

export type PontoDeCarga = { data: string; valor: number };

/**
 * O primeiro treino, sempre, e os três mais recentes.
 *
 * O primeiro é fixo porque a pergunta é "de onde eu saí"; os três últimos
 * mostram o formato do agora — subindo, subiu e voltou, subiu e parou.
 * Todos os treinos do meio ficam na curva da tela do exercício.
 */
export function primeiroEUltimos(
  pontos: PontoDeCarga[],
  recentes = 3,
): { pontos: PontoDeCarga[]; omitidos: number } {
  if (pontos.length <= recentes + 1) return { pontos, omitidos: 0 };
  return {
    pontos: [pontos[0], ...pontos.slice(-recentes)],
    omitidos: pontos.length - recentes - 1,
  };
}

/** De quanto a quanto, em por cento. Nula sem ponto de partida. */
export function variacaoPercentual(inicial: number, atual: number): number | null {
  if (!(inicial > 0)) return null;
  return ((atual - inicial) / inicial) * 100;
}

/**
 * A variação de um treino: a média das variações dos exercícios dele.
 *
 * Média, e não soma de quilos: na soma, o exercício mais pesado engoliria
 * os outros — um leg press de 200 kg pesaria vinte vezes um martelo de 9,
 * e o treino "subiria" só porque o leg press subiu.
 */
export function mediaDasVariacoes(variacoes: (number | null)[]): number | null {
  const validas = variacoes.filter((v): v is number => v !== null);
  if (validas.length === 0) return null;
  return validas.reduce((soma, v) => soma + v, 0) / validas.length;
}

/**
 * "+19%", "−4%", "0%".
 *
 * Inteiro: "+18,7%" teria precisão que uma média de quatro exercícios não
 * tem. O menos é o sinal de verdade (−), como no resto da Evolução, e a
 * queda se escreve com o mesmo peso da subida.
 */
export function escreverPercentual(v: number): string {
  const r = Math.round(v);
  if (r === 0) return "0%";
  return `${r > 0 ? "+" : "−"}${Math.abs(r)}%`;
}
