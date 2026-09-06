"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { MusicaRow } from "@/lib/ritual/dados";

export default function MusicaPlayer({ musica }: { musica: MusicaRow | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);

  if (!musica) {
    return (
      <div className="flex items-center rounded-2xl bg-texto/5 px-4 py-3">
        <span className="text-sm text-auxiliar">
          Nenhuma música adicionada ainda.
        </span>
      </div>
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
    <div className="flex items-center gap-3 rounded-2xl bg-texto/5 px-4 py-3">
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
