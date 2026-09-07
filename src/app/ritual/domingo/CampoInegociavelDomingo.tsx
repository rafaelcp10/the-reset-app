"use client";

import { useRef } from "react";
import { salvarCompromissoSlot } from "@/lib/ritual/acoes";

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

  function salvar() {
    const texto = inputRef.current?.value.trim();
    if (!texto) return;
    const fd = new FormData();
    fd.set("texto", texto);
    salvarCompromissoSlot(caminhoAtual, semanaAtualInicio, ordem, fd).catch(
      () => {},
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={valorAtual ?? ""}
      onBlur={salvar}
      placeholder={`inegociável ${ordem + 1}`}
      className="border-b border-filete-media bg-transparent py-2 text-[16.5px] text-texto outline-none placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
    />
  );
}
