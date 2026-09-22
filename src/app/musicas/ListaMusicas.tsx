"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, X } from "lucide-react";
import type { MusicaRow } from "@/lib/ritual/dados";
import { salvarFaixaSlot, removerFaixaSlot } from "@/lib/musicas/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

type Slot = { ordem: number; musica: MusicaRow | null };

export default function ListaMusicas({
  slots,
  caminhoAtual,
}: {
  slots: Slot[];
  caminhoAtual: string;
}) {
  return (
    <div className="flex grow flex-col gap-8 px-6 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <Link
          href="/ritual"
          aria-label="Voltar"
          className="-m-3 inline-flex p-3 text-auxiliar"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-[21px] text-texto">Minhas músicas</h1>
        {/* Sem promessa de "conta conectada" no futuro: o Spotify fechou a
            API para apps de terceiros, e esta é a versão definitiva. */}
        <p className="text-[16px] leading-[1.6] text-auxiliar">
          Cole o link da música — no Spotify, em Compartilhar, Copiar link.
          O nome aparece sozinho. Tocar no nome abre o Spotify naquela faixa.
        </p>
      </div>

      <div className="flex flex-col">
        {slots.map((slot, i) => (
          <div key={slot.ordem}>
            <LinhaFaixa slot={slot} caminhoAtual={caminhoAtual} />
            {i < slots.length - 1 && <div className="h-px bg-filete" />}
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
  const [estadoSalvo, executar] = useEstadoSalvo();

  if (!slot.musica) {
    function salvar() {
      const url = inputRef.current?.value.trim();
      if (!url) return;
      const fd = new FormData();
      fd.set("url", url);
      executar(salvarFaixaSlot(caminhoAtual, slot.ordem, fd));
    }

    return (
      <div className="flex flex-col gap-1 py-2">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 shrink-0 text-auxiliar-fraco" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="url"
            onBlur={salvar}
            placeholder="colar link da música"
            className="w-full bg-transparent py-2 text-[16.5px] text-auxiliar outline-none placeholder:text-auxiliar focus:text-texto"
          />
        </div>
        <IndicadorSalvo estado={estadoSalvo} />
      </div>
    );
  }

  function remover() {
    executar(removerFaixaSlot(caminhoAtual, slot.ordem));
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-2">
        <a
          href={slot.musica!.url}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-11 flex-1 items-center truncate py-2 text-[16.5px] text-texto"
        >
          {slot.musica!.nome || slot.musica!.url}
        </a>
        <button
          type="button"
          onClick={remover}
          aria-label="Remover faixa"
          className="shrink-0 text-auxiliar-fraco"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>
      <IndicadorSalvo estado={estadoSalvo} />
    </div>
  );
}
