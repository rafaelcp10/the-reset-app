/**
 * A água do dia, contada em garrafas.
 *
 * Litro é unidade de rótulo; garrafa é unidade de gesto. Quem está em pé
 * na cozinha não sabe o que são 3,1 litros, mas sabe o que são quatro
 * garrafas — e é por isso que o tamanho da garrafa é a primeira coisa que
 * a tela pergunta.
 *
 * O registro é em mililitros mesmo assim: trocar de garrafa não pode
 * reescrever o passado.
 */

/** A conta mais usada: 35 ml por quilo. */
const ML_POR_KG = 35;

export type Agua = {
  metaMl: number;
  bebidoMl: number;
  garrafaMl: number | null;
  /** Quantas garrafas cheias a meta pede, arredondando para cima. */
  garrafasNaMeta: number;
  garrafasBebidas: number;
  /** Nunca negativo: passar da meta não é dívida ao contrário. */
  faltamMl: number;
  faltamGarrafas: number;
  completou: boolean;
};

export function metaDeAgua(pesoKg: number | null): number {
  if (!pesoKg || pesoKg <= 0) return 0;
  // Arredonda para os 50 ml mais próximos: "3.115 ml" tem precisão que a
  // conta não tem, e a tela ficaria mentindo sobre o próprio rigor.
  return Math.round((pesoKg * ML_POR_KG) / 50) * 50;
}

export function montarAgua(
  pesoKg: number | null,
  garrafaMl: number | null,
  bebidoMl: number,
): Agua {
  const metaMl = metaDeAgua(pesoKg);
  const faltamMl = Math.max(0, metaMl - bebidoMl);

  return {
    metaMl,
    bebidoMl,
    garrafaMl,
    garrafasNaMeta: garrafaMl ? Math.ceil(metaMl / garrafaMl) : 0,
    garrafasBebidas: garrafaMl ? Math.floor(bebidoMl / garrafaMl) : 0,
    faltamMl,
    faltamGarrafas: garrafaMl ? Math.ceil(faltamMl / garrafaMl) : 0,
    completou: metaMl > 0 && bebidoMl >= metaMl,
  };
}

/** "2,4 L" para o que passa de mil; "750 ml" para o resto. */
export function emLitros(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(1).replace(".", ",")} L`;
  return `${ml} ml`;
}
