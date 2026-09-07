"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { MusicaRow } from "@/lib/ritual/dados";
import { adicionarMusica } from "@/lib/ritual/acoes";

export default function MusicaPlayer({
  musica,
  caminhoAtual,
}: {
  musica: MusicaRow | null;
  caminhoAtual: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [tocando, setTocando] = useState(false);
  const [adicionando, setAdicionando] = useState(false);

  if (!musica) {
    if (!adicionando) {
      return (
        <button
          type="button"
          onClick={() => setAdicionando(true)}
          className="self-start text-sm text-auxiliar underline underline-offset-4"
        >
          adicionar música
        </button>
      );
    }

    function salvar() {
      const url = inputRef.current?.value.trim();
      if (!url) {
        setAdicionando(false);
        return;
      }
      const fd = new FormData();
      fd.set("url", url);
      adicionarMusica(caminhoAtual, fd).catch(() => {});
    }

    return (
      <input
        ref={inputRef}
        type="url"
        autoFocus
        onBlur={salvar}
        placeholder="Link da música"
        className="bg-transparent text-texto outline-none placeholder:text-auxiliar/60"
      />
    );
  }

  function alternar() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={alternar}
        aria-label={tocando ? "Pausar" : "Tocar"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-texto/10"
      >
        {tocando ? (
          <Pause className="h-5 w-5 text-texto" strokeWidth={1.5} />
        ) : (
          <Play className="h-5 w-5 text-texto" strokeWidth={1.5} />
        )}
      </button>
      <span className="flex-1 truncate text-sm text-texto">
        {musica.nome || "Sua música"}
      </span>
      <audio
        ref={audioRef}
        src={musica.url}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onEnded={() => setTocando(false)}
      />
    </div>
  );
}
