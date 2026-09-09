"use client";

import { useRef } from "react";
import {
  confirmarDia,
  salvarIntencaoAmanha,
  salvarLinhaHoje,
} from "@/lib/ritual/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

export default function LinhaDoDia({
  modo,
  linhaHoje,
  linhaOntem,
  feitoOntem,
  feitoHoje,
  dataHoje,
  caminhoAtual,
  focoInicial = false,
  intencaoAmanha = null,
}: {
  modo: "manha" | "noite";
  linhaHoje: string | null;
  linhaOntem: string | null;
  feitoOntem: boolean | null;
  feitoHoje: boolean | null;
  dataHoje: string;
  caminhoAtual: string;
  focoInicial?: boolean;
  /** O que a pessoa disse ontem à noite que faria hoje. */
  intencaoAmanha?: string | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();

  if (modo === "manha") {
    function salvar() {
      const fd = new FormData();
      fd.set("linha", textareaRef.current?.value ?? "");
      executar(salvarLinhaHoje(caminhoAtual, dataHoje, fd));
    }

    return (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-acento">
            A linha de hoje
          </h2>
          <IndicadorSalvo estado={estadoSalvo} />
        </div>

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

      <CampoAmanha
        dataHoje={dataHoje}
        caminhoAtual={caminhoAtual}
        valorInicial={intencaoAmanha}
      />
    </section>
  );
}

/**
 * A ponte para a manhã seguinte. Fica no fim do check-in, depois do fiz /
 * não fiz, porque é a última coisa da noite — e é opcional: quem não
 * quiser pensar em amanhã fecha o dia sem ela.
 */
function CampoAmanha({
  dataHoje,
  caminhoAtual,
  valorInicial,
}: {
  dataHoje: string;
  caminhoAtual: string;
  valorInicial: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar() {
    const fd = new FormData();
    fd.set("amanha", inputRef.current?.value ?? "");
    executar(salvarIntencaoAmanha(caminhoAtual, dataHoje, fd));
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
          E amanhã
        </h3>
        <IndicadorSalvo estado={estadoSalvo} />
      </div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={valorInicial ?? ""}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
        enterKeyHint="done"
        placeholder="se já souber, deixa dito"
        className="w-full border-b border-filete-media bg-transparent px-2 py-1.5 text-[15px] leading-[1.6] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
      />
    </div>
  );
}
