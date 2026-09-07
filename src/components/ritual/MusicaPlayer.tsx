import Link from "next/link";
import { Music } from "lucide-react";
import type { MusicaRow } from "@/lib/ritual/dados";

export default function MusicaPlayer({ musica }: { musica: MusicaRow | null }) {
  return (
    <div className="flex items-center gap-2 text-[13.5px]">
      <Music className="h-4 w-4 shrink-0 text-auxiliar" strokeWidth={1.5} />
      <span className="flex-1 truncate text-auxiliar">
        {musica ? `${musica.nome || "Sua música"} · toca até o fim do espelho` : "Sem música"}
      </span>
      <Link
        href="/musicas"
        className="shrink-0 text-auxiliar underline underline-offset-4"
      >
        {musica ? "trocar" : "adicionar música"}
      </Link>
    </div>
  );
}
