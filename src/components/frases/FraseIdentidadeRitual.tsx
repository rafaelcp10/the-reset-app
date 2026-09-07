"use client";

import { useRef, useState } from "react";
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
        <div className="flex items-center gap-5 text-sm">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-auxiliar underline underline-offset-4"
          >
            editar
          </button>
          <button type="button" disabled className="text-auxiliar/40">
            ouvir (em breve)
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
