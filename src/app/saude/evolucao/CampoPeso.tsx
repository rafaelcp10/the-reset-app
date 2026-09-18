"use client";

import { useRef, useState } from "react";
import { salvarPeso } from "@/lib/saude/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

/**
 * O peso de hoje.
 *
 * Um campo, sem meta e sem faixa de "ideal" ao lado. O app guarda o número
 * e devolve a série; quem julga o número é quem subiu na balança.
 */
export default function CampoPeso({
  data,
  valorInicial,
}: {
  data: string;
  valorInicial: number | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();
  const [valor, setValor] = useState(
    valorInicial !== null ? String(valorInicial) : "",
  );

  function salvar() {
    executar(salvarPeso(data, valor));
  }

  return (
    <div className="bloco flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar">
          Peso de hoje
        </h2>
        <IndicadorSalvo estado={estadoSalvo} />
      </div>

      <div className="flex items-baseline gap-3">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          step="0.1"
          min={25}
          max={400}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onBlur={salvar}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inputRef.current?.blur();
            }
          }}
          enterKeyHint="done"
          placeholder="—"
          className="w-28 border-b border-filete-media bg-transparent py-1.5 text-[24px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
        />
        <span className="text-[16.5px] text-auxiliar">kg</span>
      </div>

      <p className="text-[14.5px] leading-[1.6] text-auxiliar">
        Só quando quiser. Um dia sem registro não é um buraco — é um dia em
        que você não pesou.
      </p>
    </div>
  );
}
