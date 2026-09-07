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
      <div className="flex flex-col gap-4">
        <p className="font-frase text-2xl leading-relaxed text-texto">{textoAtual}</p>
        <div className="flex items-center gap-6 text-xs uppercase tracking-wide text-auxiliar/50">
          <span className="flex items-center gap-1.5">
            <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ouvir
          </span>
          <span className="flex items-center gap-1.5">
            <Mic className="h-3.5 w-3.5" strokeWidth={1.5} />
            Gravar
          </span>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-auxiliar"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        ref={textareaRef}
        defaultValue={textoAtual}
        onBlur={(e) => salvar(e.target.value)}
        rows={4}
        autoFocus
        spellCheck={false}
        className="resize-none bg-transparent font-frase text-2xl leading-relaxed text-texto outline-none"
      />
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => salvar(textoPadrao)}
        className="self-start text-sm text-auxiliar underline underline-offset-4"
      >
        restaurar padrão
      </button>
    </div>
  );
}
