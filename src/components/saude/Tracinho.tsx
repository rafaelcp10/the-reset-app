/**
 * Uma curva do tamanho de uma palavra, para caber numa linha de lista.
 *
 * O `Grafico` é do tamanho de um painel e sangra até a borda; numa lista de
 * exercícios cada linha precisa do próprio desenho sem virar painel. É a
 * lista "Main exercises" do Hevy, onde a curva diz a direção antes de a
 * pessoa ler número nenhum.
 *
 * Mesmas regras da curva grande: sem eixo, sem zero forçado na base, sem cor
 * que muda conforme a direção. E sem âmbar — numa lista de dez linhas,
 * dez curvas âmbar seriam dez acentos.
 */

const LARGURA = 64;
const ALTURA = 24;
const MARGEM = 2.5;

export default function Tracinho({
  valores,
  descricao,
}: {
  valores: number[];
  descricao: string;
}) {
  if (valores.length < 2) return null;

  const menor = Math.min(...valores);
  const maior = Math.max(...valores);
  // Curva reta quando nada mudou: no meio, e não grudada no chão, para
  // "igual" não parecer "caiu".
  const faixa = maior - menor || 1;
  const passo = (LARGURA - MARGEM * 2) / (valores.length - 1);

  const pontos = valores.map((v, i) => {
    const y =
      maior === menor
        ? ALTURA / 2
        : ALTURA - MARGEM - ((v - menor) / faixa) * (ALTURA - MARGEM * 2);
    return `${(MARGEM + i * passo).toFixed(1)},${y.toFixed(1)}`;
  });
  const [ultX, ultY] = pontos[pontos.length - 1].split(",").map(Number);

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      className="h-6 w-16 shrink-0"
      role="img"
      aria-label={descricao}
    >
      <polyline
        points={pontos.join(" ")}
        fill="none"
        stroke="var(--color-auxiliar)"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ultX} cy={ultY} r={2.5} fill="var(--color-texto)" />
    </svg>
  );
}
