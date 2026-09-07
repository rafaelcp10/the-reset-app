"use client";

import { useRef } from "react";
import { confirmarDia, salvarLinhaHoje } from "@/lib/ritual/acoes";

export default function LinhaDoDia({
  modo,
  linhaHoje,
  linhaOntem,
  feitoOntem,
  feitoHoje,
  dataHoje,
  caminhoAtual,
  focoInicial = false,
}: {
  modo: "manha" | "noite";
  linhaHoje: string | null;
  linhaOntem: string | null;
  feitoOntem: boolean | null;
  feitoHoje: boolean | null;
  dataHoje: string;
  caminhoAtual: string;
  focoInicial?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (modo === "manha") {
    function salvar() {
      const fd = new FormData();
      fd.set("linha", textareaRef.current?.value ?? "");
      salvarLinhaHoje(caminhoAtual, dataHoje, fd).catch(() => {});
    }

    return (
      <section className="flex flex-col gap-3">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-acento">
          A linha de hoje
        </h2>

        <textarea
          ref={textareaRef}
          defaultValue={linhaHoje ?? ""}
          onBlur={salvar}
          autoFocus={focoInicial}
          placeholder="o que eu vou fazer hoje"
          rows={2}
          className="resize-none border-b border-filete-media bg-transparent px-2 py-1.5 text-[17px] leading-[1.6] text-texto outline-none placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-acento">
        A linha de hoje
      </h2>

      <p className="truncate text-[17px] leading-[1.6] text-texto">
        {linhaHoje || (
          <span className="text-auxiliar">Você não escreveu nada hoje.</span>
        )}
      </p>

      <div className="flex gap-3">
        <form
          action={confirmarDia.bind(null, caminhoAtual, dataHoje, true)}
          className="flex-1"
        >
          <button
            type="submit"
            className={`tipo-rotulo w-full rounded-[6px] py-3 text-center text-[16px] tracking-[.09em] transition-colors duration-[250ms] ${
              feitoHoje === true
                ? "bg-acento text-fundo"
                : "bg-superficie2 text-texto"
            }`}
          >
            Fiz
          </button>
        </form>
        <form
          action={confirmarDia.bind(null, caminhoAtual, dataHoje, false)}
          className="flex-1"
        >
          <button
            type="submit"
            className={`tipo-rotulo w-full rounded-[6px] py-3 text-center text-[16px] tracking-[.09em] transition-colors duration-[250ms] ${
              feitoHoje === false
                ? "bg-superficie3 text-texto"
                : "bg-superficie2 text-texto"
            }`}
          >
            Não fiz
          </button>
        </form>
      </div>

      {feitoOntem !== null && (
        <p className="text-[13.5px] text-auxiliar">
          Ontem · {feitoOntem ? "feita" : "não feita"}
          {linhaOntem ? ` — ${linhaOntem}` : ""}
        </p>
      )}
    </section>
  );
}
