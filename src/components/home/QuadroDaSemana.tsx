import type { EstadoDia, SemanaEmCurso } from "@/lib/home/semana";

/**
 * Os sete dias desta semana, uma linha por coisa.
 *
 * A mesma gramática de pontos do quadro da Academia, empilhada: cheio é
 * feito, contornado é dia que passou em branco, apagado é dia sem nada
 * previsto ou dia que ainda não acabou.
 *
 * **Nada aqui vira placar.** Não há total, não há percentual da semana,
 * não há comparação com a semana passada e não há cor que muda conforme
 * o quanto falta. A grade descreve o que aconteceu; quem lê decide o que
 * isso quer dizer.
 *
 * Sem âmbar: o acento da Home é o botão do ritual.
 */
export default function QuadroDaSemana({ semana }: { semana: SemanaEmCurso }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,28px)] items-center gap-y-2.5">
      <span aria-hidden />
      {semana.abrevs.map((abrev, i) => (
        <span key={abrev + i} className="flex flex-col items-center gap-1">
          {/* Em caixa baixa, ao contrário do resto dos rótulos do app: em
              caixa alta "DOM SEG TER" não cabe em sete colunas de 28px sem
              as palavras se encostarem — e caixa baixa se lê melhor, que é
              o motivo de a largura condensada ter saído daqui também. */}
          <span
            className={`text-[13.5px] ${
              i === semana.indiceDeHoje ? "text-texto" : "text-auxiliar-fraco"
            }`}
          >
            {abrev}
          </span>
          {/* O traço diz qual é hoje. Sem ele, a coluna de hoje e a de
              amanhã ficariam iguais — as duas apagadas, porque o dia de
              hoje ainda não acabou. */}
          <span
            aria-hidden
            className={`h-[2px] w-3.5 rounded-full ${
              i === semana.indiceDeHoje ? "bg-auxiliar" : "bg-transparent"
            }`}
          />
        </span>
      ))}

      {semana.linhas.map((linha) => (
        <Linha key={linha.chave} rotulo={linha.rotulo} dias={linha.dias} abrevs={semana.abrevs} />
      ))}
    </div>
  );
}

function Linha({
  rotulo,
  dias,
  abrevs,
}: {
  rotulo: string;
  dias: EstadoDia[];
  abrevs: string[];
}) {
  const feitos = dias.flatMap((estado, i) =>
    estado === "feito" ? [abrevs[i]] : [],
  );

  return (
    <>
      {/* Duas linhas, e não reticências: o fim da frase costuma ser o que
          diz o que fazer, e um inegociável cortado no meio não se
          reconhece de relance. */}
      <span className="line-clamp-2 pr-3 text-[15px] leading-[1.35] text-auxiliar">
        {rotulo}
      </span>

      {/* Fora do fluxo da grade (`sr-only` é posicionado), então não
          ocupa coluna nenhuma: existe só para o leitor de tela, que não
          enxerga pontinho. */}
      <span className="sr-only">
        {feitos.length > 0 ? `${rotulo}: ${feitos.join(", ")}.` : `${rotulo}: nenhum dia.`}
      </span>

      {dias.map((estado, i) => (
        <span key={i} className="flex items-center justify-center">
          <Ponto estado={estado} />
        </span>
      ))}
    </>
  );
}

function Ponto({ estado }: { estado: EstadoDia }) {
  if (estado === "feito") {
    return <span aria-hidden className="h-[20px] w-[20px] rounded-full bg-texto" />;
  }
  if (estado === "contorno") {
    return (
      <span
        aria-hidden
        className="h-[20px] w-[20px] rounded-full border border-filete-media"
      />
    );
  }
  // Ponto pequeno, e não disco cinza cheio: com cinco ou seis linhas na
  // grade, um disco por dia sem nada previsto viraria ruído e pareceria
  // mais um estado.
  return (
    <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-superficie3" />
  );
}
