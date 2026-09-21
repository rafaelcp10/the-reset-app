import { diaSemanaAbreviado, domingoDaSemana, somarDiasISO } from "@/lib/ritual/tempo";
import { diaDaSemana } from "@/lib/todo/dados";

/**
 * A semana em curso, linha por linha.
 *
 * Sete dias e nada mais: não encadeia semanas, não zera, não guarda
 * recorde. É o lugar mais fácil do app de virar streak sem perceber, e a
 * única defesa é ele não saber que existe semana passada.
 *
 * Três estados, e nenhum deles é falta:
 * - **feito** — cheio.
 * - **contorno** — o dia passou e não foi feito. Nunca riscado, nunca
 *   vermelho: "não fiz" é registro válido.
 * - **vazio** — nada previsto, ou o dia ainda não acabou.
 *
 * **Hoje é "vazio" enquanto não for feito, e não contorno.** O dia ainda
 * está aberto; marcar o que falta às dez da manhã seria cobrar por algo
 * que ainda cabe. Quem está lendo sabe qual é o dia de hoje — a coluna
 * tem marca embaixo.
 */

export type EstadoDia = "feito" | "contorno" | "vazio";

export type LinhaDaSemana = {
  chave: string;
  rotulo: string;
  /** Sete estados, de domingo a sábado. */
  dias: EstadoDia[];
};

export type SemanaEmCurso = {
  abrevs: string[];
  /** 0 a 6, a coluna de hoje. */
  indiceDeHoje: number;
  linhas: LinhaDaSemana[];
};

export type DadosDaSemana = {
  hoje: string;
  /** O dia em que a conta começou: antes dele nada era esperado. */
  desde: string;
  dias: { data: string; espelho_feito_em: string | null }[];
  compromissos: { id: string; texto: string; ordem: number }[];
  marcacoes: { compromisso_id: string; data: string; feito: boolean | null }[];
  /** Os dias da semana em que há treino marcado, de todos os treinos. */
  diasDeTreino: number[];
  sessoes: { data: string }[];
  agua: { data: string; ml: number }[];
  metaAguaMl: number;
};

export function montarSemana(d: DadosDaSemana): SemanaEmCurso {
  const inicio = domingoDaSemana(d.hoje);
  const datas = Array.from({ length: 7 }, (_, i) => somarDiasISO(inicio, i));

  /**
   * O estado de uma linha num dia.
   *
   * `esperado` é o que separa "não fiz" de "não era para fazer": um
   * domingo sem treino não é um treino perdido, e um dia anterior à
   * conta não é um ritual perdido.
   */
  const estado = (
    data: string,
    feito: boolean,
    esperado: boolean,
  ): EstadoDia => {
    if (feito) return "feito";
    if (data < d.hoje && data >= d.desde && esperado) return "contorno";
    return "vazio";
  };

  const ritualPorData = new Set(
    d.dias.filter((x) => x.espelho_feito_em).map((x) => x.data),
  );

  const linhas: LinhaDaSemana[] = [
    {
      chave: "ritual",
      rotulo: "Ritual",
      dias: datas.map((data) => estado(data, ritualPorData.has(data), true)),
    },
  ];

  // Os inegociáveis da semana, na ordem em que a pessoa os escreveu. Eles
  // vêm logo depois do ritual porque são o que ela escolheu — o resto da
  // grade é o que o app já sabia.
  for (const c of [...d.compromissos].sort((a, b) => a.ordem - b.ordem)) {
    const feitos = new Set(
      d.marcacoes
        .filter((m) => m.compromisso_id === c.id && m.feito === true)
        .map((m) => m.data),
    );
    linhas.push({
      chave: c.id,
      rotulo: c.texto,
      dias: datas.map((data) => estado(data, feitos.has(data), true)),
    });
  }

  if (d.diasDeTreino.length > 0) {
    const treinados = new Set(d.sessoes.map((s) => s.data));
    linhas.push({
      chave: "treino",
      rotulo: "Treino",
      dias: datas.map((data) =>
        estado(
          data,
          treinados.has(data),
          d.diasDeTreino.includes(diaDaSemana(data)),
        ),
      ),
    });
  }

  if (d.metaAguaMl > 0) {
    const bebido = new Map(d.agua.map((a) => [a.data, Number(a.ml)]));
    linhas.push({
      chave: "agua",
      rotulo: "Água",
      dias: datas.map((data) =>
        estado(data, (bebido.get(data) ?? 0) >= d.metaAguaMl, true),
      ),
    });
  }

  return {
    abrevs: datas.map(diaSemanaAbreviado),
    indiceDeHoje: datas.indexOf(d.hoje),
    linhas,
  };
}
