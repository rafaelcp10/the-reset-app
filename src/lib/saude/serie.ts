/**
 * Série variável: quando a repetição muda de uma série para a outra.
 *
 * O caso que pediu isto é a pirâmide — 12, 10, 8 e 6 repetições, subindo a
 * carga a cada série que encurta. Mas a peça é geral: uma lista de
 * repetições, uma carga por série. Pirâmide crescente, decrescente, drop
 * set e série reta são todas a mesma estrutura com números diferentes, e
 * o app não precisa saber o nome de nenhuma delas.
 *
 * **Nulo é "todas iguais".** Todo exercício que já existia continua sendo
 * `series × repeticoes`, sem migração e sem mudar de comportamento — e é
 * isso que mantém o caso comum com três campos em vez de seis.
 */

export type PlanoExercicio = {
  series: number;
  repeticoes: number;
  repeticoes_serie: number[] | null;
};

/** Quantas séries o plano tem de verdade: a lista manda quando existe. */
export function quantasSeries(e: PlanoExercicio): number {
  return ehVariavel(e) ? e.repeticoes_serie!.length : e.series;
}

export function ehVariavel(e: PlanoExercicio): boolean {
  return Array.isArray(e.repeticoes_serie) && e.repeticoes_serie.length > 0;
}

/** As repetições de cada série, sempre como lista — fixa ou variável. */
export function planoDeReps(e: PlanoExercicio): number[] {
  if (ehVariavel(e)) return e.repeticoes_serie!.map(Number);
  return Array.from({ length: e.series }, () => e.repeticoes);
}

/**
 * Ajusta a lista ao número de séries pedido.
 *
 * Aumentar repete a última repetição em vez de inventar uma nova — quem
 * põe uma quinta série numa pirâmide de 12/10/8/6 quase sempre quer 6 de
 * novo, e corrigir um número é mais barato que descobrir de onde veio.
 */
export function ajustarAoTamanho(reps: number[], quantas: number): number[] {
  const base = reps.length > 0 ? reps : [10];
  return Array.from(
    { length: quantas },
    (_, i) => base[i] ?? base[base.length - 1],
  );
}

/** "12 · 10 · 8 · 6", ou "3×10" quando é tudo igual. */
export function resumoDeReps(reps: number[]): string {
  if (reps.length === 0) return "—";
  const todasIguais = reps.every((r) => r === reps[0]);
  if (todasIguais) return `${reps.length}×${reps[0]}`;
  return reps.join(" · ");
}

/** 60, e não 60,00. */
export function kg(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  const n = Number(valor);
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}

/**
 * "40 a 55 kg" quando a carga sobe, "60 kg" quando não muda.
 *
 * Faixa e não lista: quatro cargas em linha não cabem ao lado das quatro
 * repetições, e o que a pessoa quer saber de relance é onde começou e
 * onde terminou.
 */
export function faixaDeCargas(cargas: (number | null)[]): string {
  const validas = cargas.filter((c): c is number => c !== null && c >= 0);
  if (validas.length === 0) return "—";

  const menor = Math.min(...validas);
  const maior = Math.max(...validas);
  if (menor === maior) return `${kg(menor)} kg`;
  return `${kg(menor)} a ${kg(maior)} kg`;
}

/**
 * Lê as cargas de um registro como lista, seja ele variável ou não.
 *
 * Um registro antigo tem `carga_kg` e nenhuma lista: ali a mesma carga
 * valeu para todas as séries, e é assim que ele é lido. Sem isso, ligar a
 * série variável num exercício com meses de histórico faria a proposta de
 * hoje começar do zero.
 */
export function cargasDoRegistro(
  registro: { carga_kg: number | null; cargas_serie: number[] | null } | null,
  quantas: number,
): (number | null)[] {
  if (!registro) return Array.from({ length: quantas }, () => null);

  const lista = registro.cargas_serie;
  return Array.from({ length: quantas }, (_, i) => {
    const daLista = lista?.[i];
    if (daLista !== undefined && daLista !== null) return Number(daLista);
    return registro.carga_kg === null ? null : Number(registro.carga_kg);
  });
}
