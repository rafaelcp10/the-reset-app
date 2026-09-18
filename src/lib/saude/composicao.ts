/**
 * Percentual de gordura pela fita métrica.
 *
 * É o método de circunferências da Marinha americana, na forma exata em que
 * está na planilha que o Rafael já usava — inclusive o `+2` do ramo
 * masculino, que a fórmula original não tem. Ele foi mantido de propósito:
 * trocar a conta faria os números novos deixarem de conversar com os
 * antigos, e uma série que muda de régua no meio não serve para nada. O
 * valor absoluto importa menos que a diferença entre duas medidas feitas do
 * mesmo jeito.
 *
 * Aqui não existe faixa de "ideal", classificação nem meta. A conta devolve
 * o número; quem julga o número é quem passou a fita.
 */

export type Sexo = "masculino" | "feminino";

export type EntradaMedida = {
  sexo: Sexo;
  alturaCm: number;
  pescocoCm: number;
  cinturaCm: number;
  /** Só o ramo feminino usa. */
  quadrilCm?: number | null;
};

export type Composicao = {
  /** Percentual de gordura, 0–100. */
  gordura: number;
  /** Só quando há peso: os dois em quilos. */
  massaMagra: number | null;
  massaGorda: number | null;
};

const log10 = (n: number) => Math.log10(n);

/**
 * Devolve `null` quando falta medida ou quando a conta cai fora do mundo
 * real — cintura menor que o pescoço, por exemplo, gera log de número
 * negativo e o resultado viraria NaN na tela.
 */
export function calcularGordura(entrada: EntradaMedida): number | null {
  const { sexo, alturaCm, pescocoCm, cinturaCm, quadrilCm } = entrada;

  if (!alturaCm || !pescocoCm || !cinturaCm) return null;
  if (alturaCm < 100 || alturaCm > 250) return null;

  let bruto: number;

  if (sexo === "feminino") {
    if (!quadrilCm) return null;
    const base = cinturaCm + quadrilCm - pescocoCm;
    if (base <= 0) return null;
    bruto =
      495 /
        (1.29579 - 0.35004 * log10(base) + 0.221 * log10(alturaCm)) -
      450;
  } else {
    const base = cinturaCm - pescocoCm;
    if (base <= 0) return null;
    bruto =
      495 /
        (1.0324 - 0.19077 * log10(base) + 0.15456 * log10(alturaCm)) -
      450 +
      2;
  }

  if (!Number.isFinite(bruto) || bruto <= 0 || bruto >= 80) return null;
  return bruto;
}

export function calcularComposicao(
  entrada: EntradaMedida,
  pesoKg: number | null,
): Composicao | null {
  const gordura = calcularGordura(entrada);
  if (gordura === null) return null;

  if (pesoKg === null || pesoKg <= 0) {
    return { gordura, massaMagra: null, massaGorda: null };
  }

  const fracao = gordura / 100;
  return {
    gordura,
    massaMagra: pesoKg * (1 - fracao),
    massaGorda: pesoKg * fracao,
  };
}

/** 15,5 — uma casa, vírgula, sem falso rigor de duas casas. */
export function umaCasa(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}
