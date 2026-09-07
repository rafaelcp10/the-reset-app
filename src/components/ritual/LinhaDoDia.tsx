"use client";

import { useRef } from "react";
import { confirmarDia, salvarLinhaHoje } from "@/lib/ritual/acoes";

export default function LinhaDoDia({
  modo,
  linhaHoje,
  linhaOntem,
  feitoHoje,
  dataHoje,
  caminhoAtual,
}: {
  modo: "manha" | "noite";
  linhaHoje: string | null;
  linhaOntem: string | null;
  feitoHoje: boolean | null;
  dataHoje: string;
  caminhoAtual: string;
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
        <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-acento">
          A linha de hoje
        </h2>

        <textarea
          ref={textareaRef}
          defaultValue={linhaHoje ?? ""}
          onBlur={salvar}
          placeholder="O que você vai fazer hoje?"
          rows={2}
          className="resize-none bg-transparent text-lg text-texto outline-none placeholder:text-auxiliar/60"
        />

        {linhaOntem && (
          <p className="text-sm text-auxiliar">Ontem: {linhaOntem}</p>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-acento">
        A linha de hoje
      </h2>

      <p className="truncate text-base text-texto">
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
            className={`w-full rounded-2xl py-3 text-center font-medium ${
              feitoHoje === true
                ? "bg-texto text-fundo"
                : "bg-texto/5 text-texto"
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
            className={`w-full rounded-2xl py-3 text-center font-medium ${
              feitoHoje === false
                ? "bg-texto/10 text-texto"
                : "bg-texto/5 text-auxiliar"
            }`}
          >
            Não fiz
          </button>
        </form>
      </div>
    </section>
  );
}
