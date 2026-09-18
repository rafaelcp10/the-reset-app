/**
 * Calorias e macronutrientes, na conta da planilha do Rafael.
 *
 * Mesma decisão do percentual de gordura: a fórmula é a que ele já usava
 * há meses, replicada como está, inclusive os arredondamentos do
 * Harris-Benedict (14 e 5 e 6,7 no lugar de 13,75 e 5,003 e 6,755) e as
 * duas constantes soltas de gasto. Trocar a régua faria os números novos
 * deixarem de conversar com os antigos.
 *
 * Nada aqui vira meta que o app cobra. A aba mostra os três números do dia
 * e o dia que está valendo; não há barra de progresso de caloria, não há
 * registro do que foi comido e não há nota no fim do dia.
 */

export type Biotipo = "ectomorfo" | "mesomorfo" | "endomorfo";
export type Objetivo = "perder_peso" | "ganhar_massa" | "manter";

export const BIOTIPOS: Biotipo[] = ["ectomorfo", "mesomorfo", "endomorfo"];

export const ROTULO_BIOTIPO: Record<Biotipo, string> = {
  ectomorfo: "Ectomorfo",
  mesomorfo: "Mesomorfo",
  endomorfo: "Endomorfo",
};

/**
 * Como cada biotipo se reconhece, sem uma palavra de fisiologia — a regra
 * de "nenhuma justificativa científica na interface" vale aqui inteira.
 */
export const DESCRICAO_BIOTIPO: Record<Biotipo, string> = {
  ectomorfo: "Magro por natureza, custa a ganhar peso.",
  mesomorfo: "Ganha músculo com facilidade, peso estável.",
  endomorfo: "Ganha peso com facilidade, custa a perder.",
};

/** O multiplicador do metabolismo basal. */
const FATOR_TMB: Record<Biotipo, number> = {
  ectomorfo: 1.4,
  mesomorfo: 1.2,
  endomorfo: 1.0,
};

/**
 * O multiplicador do gasto de treino e corrida — e ele **não** é o mesmo
 * do basal. Na planilha são 1,2 / 1,1 / 1,0 aqui contra 1,4 / 1,2 / 1,0
 * lá em cima. Parece engano e não é: está assim nas duas fórmulas dela, e
 * é assim que os números dele foram calculados até hoje.
 */
const FATOR_GASTO: Record<Biotipo, number> = {
  ectomorfo: 1.2,
  mesomorfo: 1.1,
  endomorfo: 1.0,
};

/** Constantes soltas da planilha, sem origem declarada nela. */
const POR_HORA_DE_TREINO = 0.16244314489928524;
const POR_KM_DE_CORRIDA = 0.035505430242272346;

/** O ajuste do objetivo sobre o basal. */
const FATOR_OBJETIVO: Record<Objetivo, number> = {
  manter: 1,
  ganhar_massa: 1.2,
  perder_peso: 0.8,
};

export type DadosDoCorpo = {
  sexo: "masculino" | "feminino";
  biotipo: Biotipo;
  pesoKg: number;
  alturaCm: number;
  idade: number;
};

/** Metabolismo basal, já com o multiplicador do biotipo. */
export function calcularBasal(dados: DadosDoCorpo): number {
  const { sexo, biotipo, pesoKg, alturaCm, idade } = dados;

  const bruto =
    sexo === "feminino"
      ? 665 + pesoKg * 9.6 + alturaCm * 1.8 - idade * 4.7
      : 66.5 + pesoKg * 14 + alturaCm * 5 - idade * 6.7;

  return bruto * FATOR_TMB[biotipo];
}

export function gastoDeTreino(dados: DadosDoCorpo, horas: number): number {
  if (horas <= 0) return 0;
  return (
    dados.idade * dados.pesoKg * horas * POR_HORA_DE_TREINO * FATOR_GASTO[dados.biotipo]
  );
}

export function gastoDeCorrida(dados: DadosDoCorpo, km: number): number {
  if (km <= 0) return 0;
  return (
    dados.idade * dados.pesoKg * km * POR_KM_DE_CORRIDA * FATOR_GASTO[dados.biotipo]
  );
}

export type TipoDeDia = "descanso" | "treino" | "treino_e_corrida";

export const ROTULO_DIA: Record<TipoDeDia, string> = {
  descanso: "Descanso",
  treino: "Treino",
  treino_e_corrida: "Treino e corrida",
};

export type CaloriasDoDia = Record<TipoDeDia, number>;

/**
 * Os três dias. A pessoa não escolhe entre eles como quem escolhe uma
 * dieta: o dia dela já aconteceu, e a tela só diz qual dos três ele foi.
 */
export function caloriasPorTipoDeDia(
  dados: DadosDoCorpo,
  objetivo: Objetivo,
  horasDeTreino: number,
  kmDeCorrida: number,
): CaloriasDoDia {
  const base = calcularBasal(dados) * FATOR_OBJETIVO[objetivo];
  const treino = gastoDeTreino(dados, horasDeTreino);
  const corrida = gastoDeCorrida(dados, kmDeCorrida);

  return {
    descanso: base,
    treino: base + treino,
    treino_e_corrida: base + treino + corrida,
  };
}

export type Macros = {
  proteinaG: number;
  proteinaKcal: number;
  gorduraG: number;
  gorduraKcal: number;
  carboidratoG: number;
  carboidratoKcal: number;
};

/** Padrões da planilha. A tela deixa mudar os dois. */
export const PROTEINA_G_KG_PADRAO = 2.8;
export const GORDURA_G_KG_PADRAO = 0.85;

/**
 * Proteína por quilo de **massa magra**; gordura por quilo de **peso
 * total**. Os dois denominadores são diferentes de propósito — é assim na
 * planilha, e trocar um pelo outro muda a conta em dezenas de gramas.
 *
 * O carboidrato é o que sobra: ele não tem alvo próprio, absorve o resto
 * das calorias depois que proteína e gordura saem.
 */
export function calcularMacros(
  calorias: number,
  pesoKg: number,
  massaMagraKg: number,
  proteinaGKg: number = PROTEINA_G_KG_PADRAO,
  gorduraGKg: number = GORDURA_G_KG_PADRAO,
): Macros {
  const proteinaG = massaMagraKg * proteinaGKg;
  const proteinaKcal = proteinaG * 4;

  const gorduraG = pesoKg * gorduraGKg;
  const gorduraKcal = gorduraG * 9;

  // Pode dar negativo quando as calorias do dia são poucas e os dois
  // alvos, altos. Zero é mais honesto que um carboidrato negativo — e a
  // tela avisa em vez de esconder.
  const carboidratoKcal = Math.max(0, calorias - proteinaKcal - gorduraKcal);

  return {
    proteinaG,
    proteinaKcal,
    gorduraG,
    gorduraKcal,
    carboidratoG: carboidratoKcal / 4,
    carboidratoKcal,
  };
}

/** Idade cheia, a partir da data de nascimento e do dia de hoje. */
export function idadeEm(nascimentoISO: string, hojeISO: string): number {
  const [an, mn, dn] = nascimentoISO.slice(0, 10).split("-").map(Number);
  const [ah, mh, dh] = hojeISO.split("-").map(Number);
  let idade = ah - an;
  if (mh < mn || (mh === mn && dh < dn)) idade -= 1;
  return idade;
}

/** 2.465, e não 2465 — número grande sem separador vira soletração. */
export function comMilhar(valor: number): string {
  return Math.round(valor).toLocaleString("pt-BR");
}
