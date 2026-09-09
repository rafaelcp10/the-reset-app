"use client";

import { useRef, useState } from "react";
import { apagarConta } from "@/lib/conta/exclusao";

/**
 * Fica no fim dos Ajustes, fechado por padrão e sem cor de alerta — o app
 * não usa vermelho para decisão de usuário. A barreira é escrever a
 * palavra, não um susto visual.
 */
export default function ApagarConta() {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [apagando, setApagando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function confirmar() {
    setErro(null);
    setApagando(true);
    const resultado = await apagarConta(inputRef.current?.value ?? "");
    if (resultado?.erro) {
      setErro(resultado.erro);
      setApagando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="self-start text-[13px] text-auxiliar-fraco underline underline-offset-4"
      >
        apagar minha conta
      </button>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tipo-rotulo text-[13px] tracking-[.18em] text-texto">
        Apagar a conta
      </h2>

      <p className="text-[13.5px] leading-[1.6] text-auxiliar">
        Some tudo: as cinco frases, as gravações da sua voz, os
        inegociáveis, as tarefas e o histórico de semanas. Não há como
        desfazer nem como recuperar depois.
      </p>

      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        enterKeyHint="done"
        placeholder="escreva APAGAR"
        className="w-full border-b border-filete-media bg-transparent py-2 text-[16px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
      />

      {erro && <p className="text-[12.5px] leading-[1.5] text-erro">{erro}</p>}

      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={confirmar}
          disabled={apagando}
          className="pilula tipo-rotulo rounded-[8px] px-5 py-2.5 text-[12px] tracking-[.09em] text-texto disabled:opacity-50"
        >
          {apagando ? "Apagando" : "Apagar"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-[13px] text-auxiliar underline underline-offset-4"
        >
          cancelar
        </button>
      </div>
    </section>
  );
}
