import type { PontoDeCarga } from "@/lib/saude/progresso";

/**
 * Até quatro treinos lado a lado: o primeiro e os três mais recentes, com a
 * data e a carga embaixo de cada ponto.
 *
 * O desenho responde de relance "subindo, subiu e voltou, ou subiu e
 * parou"; os números embaixo respondem "de quanto a quanto, e quando".
 *
 * **O trecho entre o primeiro e o segundo é tracejado quando há treinos no
 * meio que não aparecem.** Sem isso, o primeiro de julho e o de setembro
 * pareceriam vizinhos, e a subida entre eles pareceria ter acontecido de
 * uma semana para a outra.
 *
 * A largura da viewBox é sempre a mesma e os pontos caem no centro de cada
 * coluna: é o que alinha o SVG com a grade de datas embaixo em qualquer
 * largura de tela, com dois pontos ou com quatro.
 *
 * Mesmas regras de toda curva do app: sem eixo, sem zero forçado, sem cor
 * que muda conforme a direção, e sem âmbar — são várias numa caixa só.
 */

const LARGURA = 400;
const ALTURA = 56;
const MARGEM = 9;

/** 60, não 60,00. */
function kg(valor: number): string {
  return valor % 1 === 0 ? String(valor) : valor.toFixed(1).replace(".", ",");
}

/** "02/07", e "02/07/25" quando o ano não é o do último treino. */
function dataCurta(iso: string, anoDoUltimo: string): string {
  const [ano, mes, dia] = iso.split("-");
  return ano === anoDoUltimo ? `${dia}/${mes}` : `${dia}/${mes}/${ano.slice(2)}`;
}

export default function LinhaDoTempo({
  pontos,
  omitidos,
  descricao,
}: {
  pontos: PontoDeCarga[];
  omitidos: number;
  descricao: string;
}) {
  const n = pontos.length;
  if (n === 0) return null;

  const valores = pontos.map((p) => p.valor);
  const menor = Math.min(...valores);
  const maior = Math.max(...valores);
  const anoDoUltimo = pontos[n - 1].data.slice(0, 4);

  const coords = pontos.map((p, i) => ({
    x: ((i + 0.5) * LARGURA) / n,
    // Tudo igual fica no meio, e não grudado no chão: "manteve" não pode
    // parecer "caiu".
    y:
      maior === menor
        ? ALTURA / 2
        : ALTURA - MARGEM - ((p.valor - menor) / (maior - menor)) * (ALTURA - MARGEM * 2),
  }));

  return (
    <div className="flex flex-col gap-1.5">
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="h-auto w-full"
        role="img"
        aria-label={descricao}
      >
        {coords.slice(1).map((c, i) => (
          <line
            key={i}
            x1={coords[i].x}
            y1={coords[i].y}
            x2={c.x}
            y2={c.y}
            stroke="var(--color-auxiliar)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={i === 0 && omitidos > 0 ? "3 9" : undefined}
          />
        ))}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={5}
            fill="var(--color-texto)"
          />
        ))}
      </svg>

      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
        aria-hidden
      >
        {pontos.map((p) => (
          <span key={p.data} className="flex flex-col items-center gap-0.5">
            <span className="text-[13.5px] tabular-nums text-auxiliar-fraco">
              {dataCurta(p.data, anoDoUltimo)}
            </span>
            <span className="text-[15.5px] tabular-nums text-texto">
              {kg(p.valor)} kg
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
