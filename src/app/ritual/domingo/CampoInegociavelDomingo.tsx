"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { salvarCompromissoSlot } from "@/lib/ritual/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

export default function CampoInegociavelDomingo({
  ordem,
  semanaAtualInicio,
  valorAtual,
  caminhoAtual,
}: {
  ordem: number;
  semanaAtualInicio: string;
  valorAtual: string | null;
  caminhoAtual: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar() {
    const fd = new FormData();
    fd.set("texto", inputRef.current?.value.trim() ?? "");
    executar(salvarCompromissoSlot(caminhoAtual, semanaAtualInicio, ordem, fd));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 border-b border-filete-media focus-within:border-acento focus-within:bg-acento-escuro">
        {!valorAtual && (
          <Plus className="h-4 w-4 shrink-0 text-auxiliar-fraco" strokeWidth={1.5} />
        )}
        <input
          ref={inputRef}
          type="text"
          defaultValue={valorAtual ?? ""}
          onBlur={salvar}
          placeholder={`inegociável ${ordem + 1}`}
          className="w-full bg-transparent py-2 text-[16.5px] text-texto outline-none placeholder:text-auxiliar-fraco"
        />
      </div>
      <IndicadorSalvo estado={estadoSalvo} />
    </div>
  );
}
