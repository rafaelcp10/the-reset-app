"use client";

import { useRef, useState } from "react";
import { Play, Mic, Pencil } from "lucide-react";
import { dividirNaLacuna } from "@/lib/frases/modelo";
import { salvarLacuna } from "@/lib/frases/acoes";

export default function FraseIdentidadeRitual({
  textoBase,
  preenchimento,
  caminhoAtual,
}: {
  textoBase: string;
  preenchimento: string;
  caminhoAtual: string;
}) {
  const [editando, setEditando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [antes, depois] = dividirNaLacuna(textoBase);

  function salvar() {
    const texto = inputRef.current?.value.trim();
    if (!texto || texto === preenchimento) {
      setEditando(false);
      return;
    }
    const fd = new FormData();
    fd.set("preenchimento", texto);
    salvarLacuna(caminhoAtual, {}, fd).catch(() => {});
    setEditando(false);
  }

  if (!editando) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-frase text-2xl leading-relaxed text-texto">
          {antes}
          <span className="text-acento">{preenchimento}</span>
          {depois}
        </p>
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
    <p className="font-frase text-2xl leading-relaxed text-texto">
      {antes}
      <input
        ref={inputRef}
        type="text"
        defaultValue={preenchimento}
        onBlur={salvar}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        className="mx-1 w-40 border-b-2 border-texto bg-transparent text-center text-texto outline-none"
      />
      {depois}
    </p>
  );
}
