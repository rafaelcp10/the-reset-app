"use client";

import { useRef, useState } from "react";
import { Play, Mic, Pencil } from "lucide-react";
import type { EstadoEdicaoFrase } from "@/lib/frases/acoes";

export default function FraseAutoSalvar({
  textoAtual,
  textoPadrao,
  acaoSalvar,
}: {
  textoAtual: string;
  textoPadrao: string;
  acaoSalvar: (
    estado: EstadoEdicaoFrase,
    formData: FormData,
  ) => Promise<EstadoEdicaoFrase>;
}) {
  const [editando, setEditando] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function salvar(texto: string) {
    const valor = texto.trim();
    setEditando(false);
    if (!valor || valor === textoAtual) return;
    const fd = new FormData();
    fd.set("texto", valor);
    acaoSalvar({}, fd).catch(() => {});
  }

  if (!editando) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[16.5px] leading-[1.7] text-texto">{textoAtual}</p>
        <div className="tipo-rotulo flex items-center gap-5 text-[10px] tracking-[.16em]">
          <span className="flex items-center gap-1.5 text-auxiliar-fraco">
            <Play className="h-[13px] w-[13px]" strokeWidth={1.5} />
            Ouvir
          </span>
          <span className="flex items-center gap-1.5 text-auxiliar-fraco">
            <Mic className="h-[13px] w-[13px]" strokeWidth={1.5} />
            Gravar
          </span>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-auxiliar"
          >
            <Pencil className="h-[13px] w-[13px]" strokeWidth={1.5} />
            Editar
          </button>
        </div>
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
