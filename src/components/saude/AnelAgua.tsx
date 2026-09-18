/**
 * A água do dia, em anel.
 *
 * Um anel e não uma barra porque a pergunta aqui é "quanto do meu dia já
 * foi", e círculo cheio se lê de relance melhor que barra cheia — barra
 * pede comparar duas pontas, anel não.
 *
 * O anel é **dividido em garrafas**, não em percentual liso: cada gomo é
 * uma garrafa, e é assim que a pessoa bebe. O percentual no meio existe
 * porque garrafa é grossa demais como unidade de progresso — entre a
 * terceira e a quarta não há nada para mostrar, e o número no centro tem.
 *
 * Sem âmbar: o acento desta tela é o botão de beber. Sem cor que muda
 * conforme enche, e sem nada especial ao completar — beber água é higiene,
 * não conquista.
 */

const TAMANHO = 132;
const RAIO = 54;
const GROSSURA = 11;
/**
 * Respiro entre gomos, em graus.
 *
 * Com ponta arredondada no traço, o vão some: a curva de cada ponta tem
 * quase 6 graus de arco, então dois gomos vizinhos se encostam e o anel
 * vira um círculo liso. Por isso a ponta aqui é reta.
 */
const VAO = 5;
/** Acima disso os gomos ficam finos demais para se distinguir. */
const MAXIMO_DE_GOMOS = 12;

const centro = TAMANHO / 2;

function ponto(angulo: number) {
  const rad = ((angulo - 90) * Math.PI) / 180;
  return [centro + RAIO * Math.cos(rad), centro + RAIO * Math.sin(rad)];
}

function arco(de: number, ate: number): string {
  const [x0, y0] = ponto(de);
  const [x1, y1] = ponto(ate);
  const grande = ate - de > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${RAIO} ${RAIO} 0 ${grande} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export default function AnelAgua({
  bebidoMl,
  metaMl,
  garrafaMl,
  garrafasNaMeta,
}: {
  bebidoMl: number;
  metaMl: number;
  garrafaMl: number;
  garrafasNaMeta: number;
}) {
  const proporcao = metaMl > 0 ? Math.min(1, bebidoMl / metaMl) : 0;
  const percentual = Math.round(proporcao * 100);

  const gomos = garrafasNaMeta > 0 && garrafasNaMeta <= MAXIMO_DE_GOMOS
    ? garrafasNaMeta
    : 1;
  const passo = 360 / gomos;
  const vao = gomos > 1 ? VAO : 0;

  return (
    <svg
      viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
      className="h-[132px] w-[132px] shrink-0"
      role="img"
      aria-label={`${percentual}% da água de hoje, ${bebidoMl} de ${metaMl} mililitros.`}
    >
      {Array.from({ length: gomos }, (_, i) => {
        const de = i * passo + vao / 2;
        const ate = (i + 1) * passo - vao / 2;

        // Quanto desta garrafa já foi bebido, de 0 a 1. Com um gomo só, a
        // conta é a do dia inteiro.
        const cheio =
          gomos === 1
            ? proporcao
            : Math.min(1, Math.max(0, (bebidoMl - i * garrafaMl) / garrafaMl));

        return (
          <g key={i}>
            <path
              d={arco(de, ate)}
              fill="none"
              stroke="var(--color-superficie3)"
              strokeWidth={GROSSURA}
              strokeLinecap="butt"
            />
            {cheio > 0 && (
              <path
                d={arco(de, de + (ate - de) * cheio)}
                fill="none"
                stroke="var(--color-texto)"
                strokeWidth={GROSSURA}
                strokeLinecap="butt"
              />
            )}
          </g>
        );
      })}

      <text
        x={centro}
        y={centro - 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-[var(--color-texto)] text-[30px] tabular-nums"
      >
        {percentual}
      </text>
      <text
        x={centro}
        y={centro + 22}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-[var(--color-auxiliar)] text-[13px]"
      >
        %
      </text>
    </svg>
  );
}
