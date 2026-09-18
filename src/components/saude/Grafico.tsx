"use client";

import { useCallback } from "react";

/**
 * A curva de uma série, em SVG escrito à mão.
 *
 * Sem biblioteca: o app é um PWA que precisa abrir offline, e uma lib de
 * gráfico custa mais peso do que estas cem linhas. É o mesmo raciocínio da
 * Atmosfera, que também é SVG puro.
 *
 * Dá para arrastar o dedo em cima dela: o ponto selecionado acende, e quem
 * manda no número grande do painel é ele. Isso é o que substituiu a lista
 * de dez pesagens em texto — a mesma informação, sem dez linhas para ler.
 *
 * A curva descreve, não julga. Não há eixo, grade, meta, faixa de "ideal"
 * nem zero forçado na base. E nada muda de cor conforme a direção: descer
 * não é vitória nem derrota, depende do que a pessoa quer.
 */

const LARGURA = 320;
const ALTURA = 92;
/** Respiro para o traço e os pontos não encostarem na borda da viewBox. */
const MARGEM = 10;

export type Ponto = { data: string; valor: number };

export default function Grafico({
  pontos,
  selecionado,
  aoSelecionar,
  acento = true,
  descricao,
}: {
  pontos: Ponto[];
  /** Sem `aoSelecionar` a curva é só desenho: a Home mostra sem arrastar. */
  selecionado?: number;
  aoSelecionar?: (indice: number) => void;
  acento?: boolean;
  descricao: string;
}) {
  const interativo = Boolean(aoSelecionar);
  const alvoIndice = selecionado ?? pontos.length - 1;
  const aoApontar = useCallback(
    (evento: React.PointerEvent<SVGSVGElement>) => {
      if (!aoSelecionar || pontos.length < 2) return;
      const caixa = evento.currentTarget.getBoundingClientRect();
      if (caixa.width === 0) return;

      // Da posição do dedo na tela para o índice do ponto mais próximo,
      // passando pelo sistema da viewBox.
      const naViewBox = ((evento.clientX - caixa.left) / caixa.width) * LARGURA;
      const proporcao = (naViewBox - MARGEM) / (LARGURA - MARGEM * 2);
      const indice = Math.round(proporcao * (pontos.length - 1));

      aoSelecionar(Math.min(pontos.length - 1, Math.max(0, indice)));
    },
    [pontos.length, aoSelecionar],
  );

  const aoTeclar = useCallback(
    (evento: React.KeyboardEvent<SVGSVGElement>) => {
      if (!aoSelecionar) return;
      const passo =
        evento.key === "ArrowLeft" ? -1 : evento.key === "ArrowRight" ? 1 : 0;
      if (passo === 0) return;
      evento.preventDefault();
      aoSelecionar(
        Math.min(pontos.length - 1, Math.max(0, alvoIndice + passo)),
      );
    },
    [pontos.length, alvoIndice, aoSelecionar],
  );

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
  const id = `grafico-${acento ? "a" : "n"}-${pontos.length}-${alvoIndice}`;
  const alvo = coordenadas[alvoIndice] ?? fim;

  // Pontos intermediários só aparecem quando cabem: com trinta medidas eles
  // viram uma linha pontilhada e somem de utilidade.
  const mostrarPontos = pontos.length <= 14;

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      // `focus-visible`, e não `focus`: o retângulo de foco serve a quem
      // navega pelo teclado; aparecer a cada toque no gráfico era só uma
      // moldura âmbar piscando em volta da curva.
      className={`h-auto w-full ${
        interativo
          ? "touch-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
          : ""
      }`}
      role={interativo ? "slider" : "img"}
      tabIndex={interativo ? 0 : undefined}
      aria-label={descricao}
      aria-valuemin={interativo ? 0 : undefined}
      aria-valuemax={interativo ? pontos.length - 1 : undefined}
      aria-valuenow={interativo ? alvoIndice : undefined}
      aria-valuetext={
        interativo
          ? `${pontos[alvoIndice].valor}, em ${pontos[alvoIndice].data}`
          : undefined
      }
      onPointerDown={
        interativo
          ? (e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              aoApontar(e);
            }
          : undefined
      }
      onPointerMove={
        interativo
          ? (e) => {
              if (e.buttons === 0 && e.pointerType === "mouse") return;
              aoApontar(e);
            }
          : undefined
      }
      onKeyDown={interativo ? aoTeclar : undefined}
    >
      <defs>
        {/* O preenchimento é luz sobre a paleta, não uma segunda cor:
            some antes de virar bloco. */}
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.24" />
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

      {mostrarPontos &&
        interativo &&
        coordenadas.map((c, i) =>
          i === alvoIndice ? null : (
            <circle
              key={i}
              cx={c.x}
              cy={c.y}
              r="2.5"
              fill="var(--color-superficie2)"
              stroke={cor}
              strokeWidth="1.5"
            />
          ),
        )}

      {/* A prumada do ponto escolhido: liga a curva ao número lá em cima.
          Parada, a curva não tem número em cima para ligar. */}
      {interativo && (
        <>
          <line
            x1={alvo.x}
            y1={alvo.y}
            x2={alvo.x}
            y2={ALTURA}
            stroke={cor}
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <circle cx={alvo.x} cy={alvo.y} r="6" fill={cor} fillOpacity="0.2" />
        </>
      )}
      <circle cx={alvo.x} cy={alvo.y} r="3.5" fill={cor} />
    </svg>
  );
}
