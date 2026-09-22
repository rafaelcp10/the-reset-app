"use client";

import { useState, useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { salvarCaloriasDoDia } from "@/lib/saude/acoes";
import { comMilhar, type TipoDeDia } from "@/lib/saude/nutricao";

/**
 * Um dia, com as calorias editáveis.
 *
 * A conta sugere; quem conhece o próprio corpo corrige. Discutir com quem
 * já testou 2.200 e viu funcionar é o caminho mais curto para a pessoa
 * parar de olhar o número.
 *
 * Redefinir apaga o valor escrito, e não copia a sugestão para cima dele.
 * A diferença importa: apagado, o alvo volta a acompanhar peso, treino e
 * objetivo sozinho; copiado, ele congelaria no número de hoje.
 */
export default function LinhaCaloria({
  tipo,
  rotulo,
  valor,
  sugestao,
  manual,
  macros,
}: {
  tipo: TipoDeDia;
  rotulo: string;
  valor: number;
  sugestao: number;
  manual: boolean;
  macros: string;
}) {
  const [texto, setTexto] = useState(String(Math.round(valor)));
  const [enviando, iniciar] = useTransition();

  function salvar(bruto: string) {
    iniciar(() => void salvarCaloriasDoDia(tipo, bruto));
  }

  return (
    <div className="flex flex-col gap-1 rounded-[10px] bg-superficie3 px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] leading-[1.3] text-texto">
            {rotulo}
          </span>
          <span className="block truncate text-[14.5px] text-auxiliar-fraco">
            {macros}
          </span>
        </span>

        <span className="flex shrink-0 items-baseline gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            value={texto}
            disabled={enviando}
            onChange={(e) => setTexto(e.target.value.replace(/[^\d]/g, ""))}
            onBlur={() => salvar(texto)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            enterKeyHint="done"
            aria-label={`Calorias em dia de ${rotulo.toLowerCase()}`}
            className="w-[72px] border-b border-filete-media bg-transparent py-0.5 text-right text-[19px] tabular-nums text-texto outline-none transition-colors duration-200 focus:border-acento focus:bg-acento-escuro disabled:opacity-60"
          />
          <span className="text-[14px] text-auxiliar">kcal</span>
        </span>
      </div>

      {/* A sugestão e o botão só aparecem quando há o que desfazer. */}
      {manual && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[14.5px] text-auxiliar-fraco">
            Sugestão: {comMilhar(sugestao)}
          </span>
          <button
            type="button"
            disabled={enviando}
            onClick={() => {
              setTexto(String(Math.round(sugestao)));
              salvar("");
            }}
            className="-mr-2 inline-flex min-h-11 items-center gap-1.5 px-2 text-[14.5px] text-auxiliar disabled:opacity-60"
          >
            <RotateCcw className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Redefinir
          </button>
        </div>
      )}
    </div>
  );
}
