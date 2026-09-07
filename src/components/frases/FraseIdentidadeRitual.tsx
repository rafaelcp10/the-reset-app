"use client";

import { useRef, useState } from "react";
import { Play, Mic, Pencil } from "lucide-react";
import { dividirNaLacuna, MARCADOR_LACUNA } from "@/lib/frases/modelo";
import { salvarLacuna } from "@/lib/frases/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

const TAMANHOS = {
  home: "text-[27px] leading-[1.55]",
  ritual: "text-[16.5px] leading-[1.7]",
} as const;

export default function FraseIdentidadeRitual({
  textoBase,
  preenchimento,
  caminhoAtual,
  tamanho = "ritual",
  editavel = true,
  iniciarEditando = false,
}: {
  textoBase: string;
  preenchimento: string;
  caminhoAtual: string;
  tamanho?: keyof typeof TAMANHOS;
  editavel?: boolean;
  iniciarEditando?: boolean;
}) {
  const [editando, setEditando] = useState(iniciarEditando && editavel);
  const inputRef = useRef<HTMLInputElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();
  const [antes, depois] = dividirNaLacuna(textoBase);
  const classeTamanho = TAMANHOS[tamanho];

  function salvar() {
    const texto = inputRef.current?.value.trim();
    setEditando(false);
    if (!texto || texto === preenchimento) return;
    const fd = new FormData();
    fd.set("preenchimento", texto);
    executar(salvarLacuna(caminhoAtual, {}, fd));
  }

  if (!editando) {
    return (
      <div className="flex flex-col gap-2">
        <p className={`${classeTamanho} text-texto`}>
          {antes}
          {preenchimento ? (
            <span className="text-acento">{preenchimento}</span>
          ) : (
            <span className="text-auxiliar-fraco">{MARCADOR_LACUNA}</span>
          )}
          {depois}
        </p>
        {editavel && (
          <div className="tipo-rotulo flex items-center gap-5 text-[10px] tracking-[.16em]">
            <span className="flex items-center gap-1.5 text-auxiliar-fraco">
              <Play className="h-[13px] w-[13px]" strokeWidth={1.5} />
              Ouvir
            </span>
            <span className="flex items-center gap-1.5 text-auxiliar-fraco">
              <Mic className="h-[13px] w-[13px]" strokeWidth={1.5} />
              Gravar
            </span>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 text-auxiliar"
            >
              <Pencil className="h-[13px] w-[13px]" strokeWidth={1.5} />
              Editar
            </button>
            <IndicadorSalvo estado={estadoSalvo} />
          </div>
        )}
      </div>
    );
  }

  return (
    <p className={`${classeTamanho} text-texto`}>
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
        className="mx-1 w-40 border-b-2 border-acento bg-acento-escuro text-center text-acento outline-none"
      />
      {depois}
    </p>
  );
}
