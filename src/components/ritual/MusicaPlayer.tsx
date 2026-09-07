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
      <div className="flex items-center gap-2 text-[13.5px]">
        <Music className="h-4 w-4 shrink-0 text-auxiliar" strokeWidth={1.5} />
        <input
          ref={inputRef}
          type="url"
          autoFocus
          onBlur={salvar}
          defaultValue={musica?.url ?? ""}
          placeholder="link da música"
          className="flex-1 border-b border-filete-media bg-transparent py-1.5 text-texto outline-none placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[13.5px]">
      <Music className="h-4 w-4 shrink-0 text-auxiliar" strokeWidth={1.5} />
      {musica ? (
        <span className="flex-1 truncate text-auxiliar">
          {musica.nome || "Sua música"} · toca até o fim do espelho
        </span>
      ) : (
        <span className="flex-1 text-auxiliar">Sem música</span>
      )}
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="shrink-0 text-auxiliar underline underline-offset-4"
      >
        {musica ? "trocar" : "adicionar música"}
      </button>
    </div>
  );
}
