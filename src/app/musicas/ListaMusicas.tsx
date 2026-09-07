"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { MusicaRow } from "@/lib/ritual/dados";
import { salvarFaixaSlot } from "@/lib/musicas/acoes";

type Slot = { ordem: number; musica: MusicaRow | null };

export default function ListaMusicas({
  slots,
  caminhoAtual,
}: {
  slots: Slot[];
  caminhoAtual: string;
}) {
  return (
    <div className="flex flex-col gap-8 px-6 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <Link href="/ritual" aria-label="Voltar" className="text-auxiliar">
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <span className="rounded-[3px] bg-superficie2 px-2 py-0.5 text-[10px] uppercase tracking-[.16em] text-auxiliar-fraco">
          Em breve
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-[21px] text-texto">Minhas músicas</h1>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          Na primeira versão é um link salvo que abre o app de música.
          Depois, conta conectada.
        </p>
      </div>

      <div className="flex flex-col">
        {slots.map((slot, i) => (
          <div key={slot.ordem}>
            <LinhaFaixa
              slot={slot}
              caminhoAtual={caminhoAtual}
            />
            {i < slots.length - 1 && (
              <div className="h-px bg-filete" />
            )}
          </div>
        ))}
      </div>

      <Link
        href="/ritual"
        className="tipo-rotulo w-full rounded-[6px] bg-acento py-3 text-center text-[16px] tracking-[.09em] text-fundo"
      >
        Voltar ao ritual
      </Link>
    </div>
  );
}

function LinhaFaixa({
  slot,
  caminhoAtual,
}: {
  slot: Slot;
  caminhoAtual: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!slot.musica) {
    function salvar() {
      const url = inputRef.current?.value.trim();
      if (!url) return;
      const fd = new FormData();
      fd.set("url", url);
      salvarFaixaSlot(caminhoAtual, slot.ordem, fd).catch(() => {});
    }

    return (
      <input
        ref={inputRef}
        type="url"
        onBlur={salvar}
        placeholder="adicionar música"
        className="w-full bg-transparent py-4 text-[15px] text-auxiliar outline-none placeholder:text-auxiliar focus:text-texto"
      />
    );
  }

  return (
    <p className="truncate py-4 text-[15px] text-texto">
      {slot.musica.nome || slot.musica.url}
    </p>
  );
}
