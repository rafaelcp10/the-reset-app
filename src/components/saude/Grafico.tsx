/**
 * A curva de uma série, em SVG escrito à mão.
 *
 * Sem biblioteca: o app é um PWA que precisa abrir offline, e uma lib de
 * gráfico custa mais peso do que estas trinta linhas. É o mesmo raciocínio
 * da Atmosfera, que também é SVG puro.
 *
 * A curva descreve, não julga. Não há eixo, grade, meta, faixa de "ideal"
 * nem zero forçado na base — ela mostra o caminho entre o primeiro e o
 * último ponto, e mais nada. Subir ou descer aqui não é vitória nem
 * derrota, então nada muda de cor conforme a direção.
 */

const LARGURA = 320;
const ALTURA = 76;
/** Respiro para o traço e o ponto não encostarem na borda da viewBox. */
const MARGEM = 8;

export type Ponto = { data: string; valor: number };

export default function Grafico({
  pontos,
  acento = false,
  descricao,
}: {
  pontos: Ponto[];
  /** O âmbar é um por tela: só a curva principal usa. */
  acento?: boolean;
  /** Lido por leitor de tela no lugar do desenho. */
  descricao: string;
}) {
  // Com um ponto só não há caminho, e uma linha reta de um ponto mentiria.
  if (pontos.length < 2) return null;

  const valores = pontos.map((p) => p.valor);
  const minimo = Math.min(...valores);
  const maximo = Math.max(...valores);
  // Série constante viraria divisão por zero; vira uma linha no meio.
  const amplitude = maximo - minimo || 1;

  const util = ALTURA - MARGEM * 2;
  const passo = (LARGURA - MARGEM * 2) / (pontos.length - 1);

  const coordenadas = pontos.map((ponto, indice) => {
    const x = MARGEM + indice * passo;
    const proporcao =
      maximo === minimo ? 0.5 : (ponto.valor - minimo) / amplitude;
    // SVG cresce para baixo: o maior valor precisa do menor y.
    const y = MARGEM + util - proporcao * util;
    return { x, y };
  });

  const traco = coordenadas
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const fim = coordenadas[coordenadas.length - 1];
  const area = `${traco} L${fim.x.toFixed(1)} ${ALTURA} L${coordenadas[0].x.toFixed(1)} ${ALTURA} Z`;

  const cor = acento ? "var(--color-acento)" : "var(--color-auxiliar)";
  const id = `grafico-${acento ? "acento" : "neutro"}-${pontos.length}`;

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      className="h-auto w-full"
      role="img"
      aria-label={descricao}
    >
      <defs>
        {/* O preenchimento é luz sobre a paleta, não uma segunda cor:
            some antes de virar bloco. */}
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.22" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${id})`} />
      <path
        d={traco}
        fill="none"
        stroke={cor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* O ponto de hoje: é onde o olho precisa parar. */}
      <circle cx={fim.x} cy={fim.y} r="3.5" fill={cor} />
    </svg>
  );
}
