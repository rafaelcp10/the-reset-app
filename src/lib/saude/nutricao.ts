/**
 * Calorias e macronutrientes, na conta da planilha do Rafael.
 *
 * Nasceu como cópia fiel da planilha dele. Três coisas mudaram em
 * 2026-09-18, depois de conferir a planilha contra os métodos padrão:
 *
 * 1. **O basal usa Katch-McArdle quando a massa magra é conhecida.** É o
 *    método indicado para quem tem pouca gordura e sabe o próprio
 *    percentual — e a Evolução já coleta isso. Sem fita passada, cai no
 *    Harris-Benedict da planilha.
 * 2. **A corrida passou a ser 1 kcal por quilo por quilômetro**, que é a
 *    estimativa consagrada. A constante da planilha dava 48% a mais.
 * 3. **O corte do objetivo é aplicado ao total**, e não só ao basal. Antes
 *    o exercício entrava inteiro depois do corte, então quem treinava mais
 *    tinha déficit percentual menor: 20% no descanso e 14% no dia de
 *    treino e corrida.
 *
 * O que **não** mudou: o gasto de treino continua na constante da planilha.
 * Ela dá 13% a mais que 6 MET (musculação vigorosa), dentro da margem
 * desse tipo de estimativa — e musculação não tem um número consagrado
 * como o da corrida.
 *
 * Nada aqui vira meta que o app cobra. A aba mostra os três números do dia
 * e o dia que está valendo; não há barra de progresso de caloria, não há
 * registro do que foi comido e não há nota no fim do dia.
 */

export type Biotipo = "ectomorfo" | "mesomorfo" | "endomorfo";
export type Objetivo = "perder_peso" | "ganhar_massa" | "manter";

export const BIOTIPOS: Biotipo[] = ["ectomorfo", "mesomorfo", "endomorfo"];

export const OBJETIVOS: Objetivo[] = ["perder_peso", "manter", "ganhar_massa"];

/**
 * "Perder gordura", e não "perder peso": peso inclui músculo e água, e
 * perder músculo é o contrário do que quem escolhe essa opção quer. O
 * valor guardado no banco continua sendo `perder_peso`, porque a coluna
 * `meta_saude` já existia com esse nome e renomear não muda nada.
 */
export const ROTULO_OBJETIVO: Record<Objetivo, string> = {
  perder_peso: "Perder gordura",
  manter: "Manter o peso",
  ganhar_massa: "Ganhar massa",
};

/** O que cada objetivo faz com o número, dito sem fisiologia. */
export const DESCRICAO_OBJETIVO: Record<Objetivo, string> = {
  perder_peso: "Come 20% menos do que gasta.",
  manter: "Come o que gasta.",
  ganhar_massa: "Come 15% mais do que gasta.",
};

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

/**
 * O multiplicador do basal, da planilha.
 *
 * Ele se chama biotipo e funciona como **fator de rotina**: é o que separa
 * o gasto de um dia sem exercício deliberado do metabolismo parado. Os
 * valores caem exatamente na faixa dos fatores de atividade usados por
 * toda calculadora de TDEE (1,2 sedentário a 1,375 leve), e é assim que
 * ele é aplicado aqui — o exercício entra depois, por fora.
 */
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

/** Constante solta da planilha, sem origem declarada nela. */
const POR_HORA_DE_TREINO = 0.16244314489928524;

/**
 * Correr custa mais ou menos um quilocaloria por quilo por quilômetro,
 * quase independente do ritmo. É a estimativa consagrada, e substituiu a
 * constante da planilha, que dava 48% a mais.
 */
const POR_KG_POR_KM = 1.0;

/**
 * O ajuste do objetivo sobre o **gasto do dia** — nunca sobre o basal.
 *
 * Perder: 20% abaixo. A faixa recomendada é de 15% a 25%, com o lado
 * conservador para quem já está magro; 20% é o meio dela.
 *
 * Ganhar: 15% acima, e não 20% como estava. A faixa é de 5% a 15%, com o
 * lado alto para quem está começando — acima disso o que entra a mais vira
 * gordura, não músculo.
 */
const FATOR_OBJETIVO: Record<Objetivo, number> = {
  manter: 1,
  ganhar_massa: 1.15,
  perder_peso: 0.8,
};

/**
 * Abaixo disto o app não recomenda, por mais que a conta peça.
 *
 * Dois pisos, e vale o maior: o próprio metabolismo basal, e um mínimo
 * absoluto de 1.500 para homens e 1.200 para mulheres. Um corte de 20%
 * sobre um dia de descanso magro pode cair abaixo do basal — e aí o
 * número deixa de ser um alvo e vira um problema.
 *
 * O piso só existe para baixo. Ganhar massa nunca esbarra nele.
 */
const MINIMO_ABSOLUTO = { masculino: 1500, feminino: 1200 } as const;

export function pisoDeSeguranca(
  basalPuroKcal: number,
  sexo: "masculino" | "feminino",
): number {
  return Math.max(basalPuroKcal, MINIMO_ABSOLUTO[sexo]);
}

export type DadosDoCorpo = {
  sexo: "masculino" | "feminino";
  biotipo: Biotipo;
  pesoKg: number;
  alturaCm: number;
  idade: number;
};

/**
 * Metabolismo basal puro, sem fator de rotina.
 *
 * Com massa magra conhecida usa Katch-McArdle, que é construído em cima
 * dela e é o mais preciso para quem tem pouca gordura. Sem ela, cai no
 * Harris-Benedict de 1919 nos arredondamentos da planilha — que ficam 7%
 * acima do Mifflin-St Jeor e 2% abaixo do Katch, ou seja, entre os dois
 * padrões, e não inflado como parecia.
 */
export function basalPuro(
  dados: DadosDoCorpo,
  massaMagraKg?: number | null,
): number {
  if (massaMagraKg && massaMagraKg > 0) return 370 + 21.6 * massaMagraKg;

  const { sexo, pesoKg, alturaCm, idade } = dados;
  return sexo === "feminino"
    ? 665 + pesoKg * 9.6 + alturaCm * 1.8 - idade * 4.7
    : 66.5 + pesoKg * 14 + alturaCm * 5 - idade * 6.7;
}

/** O gasto de um dia sem exercício deliberado. */
export function calcularBasal(
  dados: DadosDoCorpo,
  massaMagraKg?: number | null,
): number {
  return basalPuro(dados, massaMagraKg) * FATOR_TMB[dados.biotipo];
}

export function gastoDeTreino(dados: DadosDoCorpo, horas: number): number {
  if (horas <= 0) return 0;
  return (
    dados.idade * dados.pesoKg * horas * POR_HORA_DE_TREINO * FATOR_GASTO[dados.biotipo]
  );
}

/**
 * Sem idade e sem fator de biotipo: a conta consagrada da corrida é só
 * peso vezes distância. Meter os dois de volta seria voltar ao número que
 * estava 48% alto.
 */
export function gastoDeCorrida(dados: DadosDoCorpo, km: number): number {
  if (km <= 0) return 0;
  return dados.pesoKg * km * POR_KG_POR_KM;
}

export type TipoDeDia = "descanso" | "treino" | "treino_e_corrida";

export const ROTULO_DIA: Record<TipoDeDia, string> = {
  descanso: "Descanso",
  treino: "Treino",
  treino_e_corrida: "Treino e corrida",
};

export type CaloriasDoDia = Record<TipoDeDia, number>;

/** O gasto de cada tipo de dia, sem objetivo nenhum aplicado. */
export function gastoPorTipoDeDia(
  dados: DadosDoCorpo,
  horasDeTreino: number,
  kmDeCorrida: number,
  massaMagraKg?: number | null,
): CaloriasDoDia {
  const base = calcularBasal(dados, massaMagraKg);
  const treino = gastoDeTreino(dados, horasDeTreino);
  const corrida = gastoDeCorrida(dados, kmDeCorrida);

  return {
    descanso: base,
    treino: base + treino,
    treino_e_corrida: base + treino + corrida,
  };
}

/**
 * Os três dias. A pessoa não escolhe entre eles como quem escolhe uma
 * dieta: o dia dela já aconteceu, e a tela só diz qual dos três ele foi.
 */
export function caloriasPorTipoDeDia(
  dados: DadosDoCorpo,
  objetivo: Objetivo,
  horasDeTreino: number,
  kmDeCorrida: number,
  massaMagraKg?: number | null,
): { alvos: CaloriasDoDia; gastos: CaloriasDoDia; pisoAplicado: boolean } {
  const gastos = gastoPorTipoDeDia(
    dados,
    horasDeTreino,
    kmDeCorrida,
    massaMagraKg,
  );

  // O corte incide sobre o gasto do dia, e não só sobre o basal. Na
  // planilha o exercício entrava inteiro depois do corte, e o déficit
  // percentual encolhia justamente nos dias em que se treina mais.
  const corte = FATOR_OBJETIVO[objetivo];
  const piso = pisoDeSeguranca(basalPuro(dados, massaMagraKg), dados.sexo);

  let pisoAplicado = false;
  const comPiso = (valor: number) => {
    const alvo = valor * corte;
    if (corte < 1 && alvo < piso) {
      pisoAplicado = true;
      return piso;
    }
    return alvo;
  };

  return {
    alvos: {
      descanso: comPiso(gastos.descanso),
      treino: comPiso(gastos.treino),
      treino_e_corrida: comPiso(gastos.treino_e_corrida),
    },
    gastos,
    pisoAplicado,
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
