"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { criarTarefa } from "@/lib/todo/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

/**
 * Um campo só. A pessoa escreve e pronto — o tipo se escolhe depois, no
 * detalhe do item. Salva ao sair do campo ou no Enter, sem botão.
 */
export default function CampoAdicionar({
  caminhoAtual,
}: {
  caminhoAtual: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [temTexto, setTemTexto] = useState(false);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar() {
    const texto = inputRef.current?.value.trim();
    if (!texto) return;
    const fd = new FormData();
    fd.set("texto", texto);
    if (inputRef.current) inputRef.current.value = "";
    setTemTexto(false);
    executar(criarTarefa(caminhoAtual, fd));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 border-b border-filete-media transition-colors duration-200 focus-within:border-acento focus-within:bg-acento-escuro">
        <input
          ref={inputRef}
          type="text"
          onBlur={salvar}
          onChange={(e) => setTemTexto(e.target.value.trim().length > 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              salvar();
            }
          }}
          enterKeyHint="done"
          placeholder="adicionar"
          className="w-full bg-transparent py-3 text-[15px] text-texto outline-none placeholder:text-auxiliar-fraco"
        />
        {/* O "+" é o próprio botão de gravar: some quando não há o que
            adicionar, para não virar enfeite. */}
        {temTexto && (
          <button
            type="button"
            onClick={salvar}
            aria-label="Adicionar"
            className="-m-2 inline-flex shrink-0 p-2 text-texto"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        )}
      </div>
      <IndicadorSalvo estado={estadoSalvo} />
    </div>
  );
}
