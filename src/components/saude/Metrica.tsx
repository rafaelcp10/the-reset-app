import type { ReactNode } from "react";

/**
 * Um número, do tamanho da importância dele.
 *
 * A tela antes dizia "São 1,1 kg de diferença, em 4 registros" — uma frase
 * para um dado que cabe em dois números. Ler frase cansa mais que ler
 * número, e esta aba se abre para conferir, não para ler.
 *
 * O painel de série grande, com curva que se arrasta, é o `PainelSerie`.
 * Este aqui é o painel parado: número que não tem histórico para mostrar,
 * ou que não merece a tela inteira.
 */
export default function Metrica({
  rotulo,
  valor,
  unidade,
  nota,
  children,
}: {
  rotulo: string;
  valor: string;
  unidade?: string;
  /** De onde veio, ou em quanto tempo. Uma linha, nunca duas. */
  nota?: string | null;
  /** A curva, quando há série suficiente para desenhar uma. */
  children?: ReactNode;
}) {
  return (
    <div className="bloco flex flex-col gap-3 overflow-hidden px-4 py-4">
      <div className="flex flex-col gap-1.5">
        <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
          {rotulo}
        </span>

        <span className="flex items-baseline gap-1.5">
          <span className="text-[26px] leading-none tabular-nums text-texto">
            {valor}
          </span>
          {unidade && (
            <span className="text-[16px] text-auxiliar">{unidade}</span>
          )}
        </span>

        {nota && (
          <span className="text-[15.5px] leading-[1.5] text-auxiliar">
            {nota}
          </span>
        )}
      </div>

      {/* A curva sangra até a borda do bloco: ela é o fundo do número, não
          um segundo elemento ao lado dele. */}
      {children && <div className="-mx-4 -mb-4">{children}</div>}
    </div>
  );
}
