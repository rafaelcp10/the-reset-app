"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { criarTreino } from "@/lib/academia/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

/** Mesmo gesto do campo de adicionar do To-do: escreve e pronto. */
export default function NovoTreino() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [temTexto, setTemTexto] = useState(false);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar() {
    const nome = inputRef.current?.value.trim();
    if (!nome) return;
    const fd = new FormData();
    fd.set("nome", nome);
    if (inputRef.current) inputRef.current.value = "";
    setTemTexto(false);
    executar(criarTreino(fd));
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
          placeholder="novo treino"
          className="w-full bg-transparent py-3 text-[15px] text-texto outline-none placeholder:text-auxiliar-fraco"
        />
        {temTexto && (
          <button
            type="button"
            onClick={salvar}
            aria-label="Criar treino"
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
