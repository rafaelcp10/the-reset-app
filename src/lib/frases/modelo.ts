export const FUNCOES = [
  "identidade",
  "seguranca",
  "como_falo",
  "palavra",
  "ritmo",
] as const;

export type Funcao = (typeof FUNCOES)[number];

export const MARCADOR_LACUNA = "______";

type FraseBase = {
  texto: string;
  temLacuna: boolean;
};

export const FRASES_PADRAO: Record<Funcao, FraseBase> = {
  identidade: {
    texto: `Quem eu fui até ontem não decide quem eu sou hoje. Hoje eu escolho ser ${MARCADOR_LACUNA}.`,
    temLacuna: true,
  },
  seguranca: {
    texto: "Agora, nesse momento, está tudo bem. Eu não preciso estar em alerta.",
    temLacuna: false,
  },
  como_falo: {
    texto:
      "Hoje eu falo comigo do jeito que eu falaria com a pessoa que mais amo nesse mundo.",
    temLacuna: false,
  },
  palavra: {
    texto: "O que eu começo, eu termino. Feito é melhor que perfeito.",
    temLacuna: false,
  },
  ritmo: {
    texto: "Eu posso ir devagar e ainda assim chegar.",
    temLacuna: false,
  },
};

export const ROTULOS_FUNCAO: Record<Funcao, string> = {
  identidade: "Identidade",
  seguranca: "Segurança",
  como_falo: "Como eu falo comigo",
  palavra: "Cumprir a palavra",
  ritmo: "Ritmo",
};

export type FraseRow = {
  id: string;
  usuario_id: string;
  funcao: Funcao;
  texto: string;
  preenchimento_lacuna: string | null;
  versao: number;
  criado_em: string;
};

/** Divide o texto de uma frase com lacuna em [antes, depois] do marcador. */
export function dividirNaLacuna(texto: string): [string, string] {
  const indice = texto.indexOf(MARCADOR_LACUNA);
  if (indice === -1) return [texto, ""];
  return [
    texto.slice(0, indice),
    texto.slice(indice + MARCADOR_LACUNA.length),
  ];
}

/** Texto de leitura da frase, com a lacuna já preenchida quando houver. */
export function textoCompleto(frase: FraseRow): string {
  if (!frase.preenchimento_lacuna) return frase.texto;
  return frase.texto.replace(MARCADOR_LACUNA, frase.preenchimento_lacuna);
}
