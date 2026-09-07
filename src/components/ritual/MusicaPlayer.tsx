"use client";

import { useRef, useState } from "react";
import { Music } from "lucide-react";
import type { MusicaRow } from "@/lib/ritual/dados";
import { definirMusica } from "@/lib/ritual/acoes";

export default function MusicaPlayer({
  musica,
  caminhoAtual,
}: {
  musica: MusicaRow | null;
  caminhoAtual: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editando, setEditando] = useState(false);

  function salvar() {
    const url = inputRef.current?.value.trim();
    setEditando(false);
    if (!url) return;
    const fd = new FormData();
    fd.set("url", url);
    definirMusica(caminhoAtual, fd).catch(() => {});
  }

  if (editando) {
    return (
      <input
        ref={inputRef}
        type="url"
        autoFocus
        onBlur={salvar}
        defaultValue={musica?.url ?? ""}
        placeholder="Link da música"
        className="bg-transparent text-sm text-texto outline-none placeholder:text-auxiliar/60"
      />
    );
  }

  if (!musica) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="self-start text-sm text-auxiliar underline underline-offset-4"
      >
        adicionar música
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Music className="h-4 w-4 shrink-0 text-auxiliar" strokeWidth={1.5} />
      <span className="flex-1 truncate text-texto">
        {musica.nome || "Sua música"}
      </span>
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="shrink-0 text-auxiliar underline underline-offset-4"
      >
        trocar
      </button>
    </div>
  );
}
