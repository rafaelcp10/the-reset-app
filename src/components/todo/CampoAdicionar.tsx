"use client";

import { useRef } from "react";
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
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar() {
    const texto = inputRef.current?.value.trim();
    if (!texto) return;
    const fd = new FormData();
    fd.set("texto", texto);
    if (inputRef.current) inputRef.current.value = "";
    executar(criarTarefa(caminhoAtual, fd));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 border-b border-filete-media transition-colors duration-200 focus-within:border-acento focus-within:bg-acento-escuro">
        <Plus
          className="h-4 w-4 shrink-0 text-auxiliar-fraco"
          strokeWidth={1.5}
        />
        <input
          ref={inputRef}
          type="text"
          onBlur={salvar}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              salvar();
            }
          }}
          placeholder="adicionar"
          className="w-full bg-transparent py-3 text-[15px] text-texto outline-none placeholder:text-auxiliar-fraco"
        />
      </div>
      <IndicadorSalvo estado={estadoSalvo} />
    </div>
  );
}
