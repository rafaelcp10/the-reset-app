"use client";

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { dividirNaLacuna, MARCADOR_LACUNA } from "@/lib/frases/modelo";
import { salvarLacuna } from "@/lib/frases/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";
import GravacaoFrase from "./GravacaoFrase";

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
  gravavel = false,
  urlGravacao = null,
}: {
  textoBase: string;
  preenchimento: string;
  caminhoAtual: string;
  tamanho?: keyof typeof TAMANHOS;
  editavel?: boolean;
  iniciarEditando?: boolean;
  /** Ouvir/gravar só existem na Tela do Ritual — não na Home nem no domingo. */
  gravavel?: boolean;
  urlGravacao?: string | null;
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

  const botaoEditar = (
    <button
      type="button"
      onClick={() => setEditando(true)}
      className="flex items-center gap-1.5 text-auxiliar"
    >
      <Pencil className="h-[13px] w-[13px]" strokeWidth={1.5} />
      Editar
    </button>
  );

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
        {editavel &&
          (gravavel ? (
            <GravacaoFrase
              funcao="identidade"
              caminhoAtual={caminhoAtual}
              urlGravacao={urlGravacao}
            >
              {botaoEditar}
              <IndicadorSalvo estado={estadoSalvo} />
            </GravacaoFrase>
          ) : (
            <div className="tipo-rotulo flex items-center gap-5 text-[10px] tracking-[.16em]">
              {botaoEditar}
              <IndicadorSalvo estado={estadoSalvo} />
            </div>
          ))}
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
