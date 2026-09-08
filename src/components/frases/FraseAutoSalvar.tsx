"use client";

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import type { EstadoEdicaoFrase } from "@/lib/frases/acoes";
import type { Funcao } from "@/lib/frases/modelo";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";
import GravacaoFrase from "./GravacaoFrase";

export default function FraseAutoSalvar({
  textoAtual,
  textoPadrao,
  acaoSalvar,
  funcao,
  caminhoAtual,
  urlGravacao,
}: {
  textoAtual: string;
  textoPadrao: string;
  acaoSalvar: (
    estado: EstadoEdicaoFrase,
    formData: FormData,
  ) => Promise<EstadoEdicaoFrase>;
  funcao: Funcao;
  caminhoAtual: string;
  urlGravacao: string | null;
}) {
  const [editando, setEditando] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar(texto: string) {
    const valor = texto.trim();
    setEditando(false);
    if (!valor || valor === textoAtual) return;
    const fd = new FormData();
    fd.set("texto", valor);
    executar(acaoSalvar({}, fd));
  }

  if (!editando) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[16.5px] leading-[1.7] text-texto">{textoAtual}</p>
        <GravacaoFrase
          funcao={funcao}
          caminhoAtual={caminhoAtual}
          urlGravacao={urlGravacao}
        >
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-auxiliar"
          >
            <Pencil className="h-[13px] w-[13px]" strokeWidth={1.5} />
            Editar
          </button>
          <IndicadorSalvo estado={estadoSalvo} />
        </GravacaoFrase>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        ref={textareaRef}
        defaultValue={textoAtual}
        onBlur={(e) => salvar(e.target.value)}
        rows={4}
        autoFocus
        spellCheck={false}
        className="resize-none border-b border-filete-media bg-transparent px-2 py-1.5 text-[16.5px] leading-[1.7] text-texto outline-none focus:border-acento focus:bg-acento-escuro"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => salvar(textoPadrao)}
        className="self-start text-[13px] text-auxiliar underline underline-offset-4"
      >
        restaurar padrão
      </button>
    </div>
  );
}
