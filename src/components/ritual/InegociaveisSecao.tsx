"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import { marcarCompromissoDia, salvarCompromissoSlot } from "@/lib/ritual/acoes";

export default function InegociaveisSecao({
  inegociaveis,
  semanaInicio,
  dataHoje,
  caminhoAtual,
}: {
  inegociaveis: InegociavelSlot[];
  semanaInicio: string;
  dataHoje: string;
  caminhoAtual: string;
}) {
  const temSlotVazio = inegociaveis.some((slot) => !slot.compromisso);

  return (
    <section className="flex flex-col gap-3.5 py-3.5">
      <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
        Inegociáveis
      </h2>

      {temSlotVazio && (
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          Os três inegociáveis são definidos no domingo. Ficam iguais a
          semana toda.
        </p>
      )}

      <div className="flex flex-col">
        {inegociaveis.map((slot) => (
          <LinhaInegociavel
            key={slot.ordem}
            slot={slot}
            semanaInicio={semanaInicio}
            dataHoje={dataHoje}
            caminhoAtual={caminhoAtual}
          />
        ))}
      </div>
    </section>
  );
}

function LinhaInegociavel({
  slot,
  semanaInicio,
  dataHoje,
  caminhoAtual,
}: {
  slot: InegociavelSlot;
  semanaInicio: string;
  dataHoje: string;
  caminhoAtual: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (!slot.compromisso) {
    function salvar() {
      const texto = inputRef.current?.value.trim();
      if (!texto) return;
      const fd = new FormData();
      fd.set("texto", texto);
      salvarCompromissoSlot(caminhoAtual, semanaInicio, slot.ordem, fd).catch(
        () => {},
      );
    }

    return (
      <input
        ref={inputRef}
        type="text"
        onBlur={salvar}
        placeholder={`definir inegociável ${slot.ordem + 1}`}
        className="min-h-12 border-b border-filete bg-transparent text-[16.5px] text-texto outline-none placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
      />
    );
  }

  const { compromisso, feitoHoje } = slot;
  const marcado = feitoHoje === true;

  return (
    <form
      action={marcarCompromissoDia.bind(
        null,
        caminhoAtual,
        compromisso.id,
        dataHoje,
        !marcado,
      )}
    >
      <button
        type="submit"
        aria-label={`${compromisso.texto} — ${marcado ? "feito hoje" : "não marcado"}`}
        className="flex min-h-12 w-full items-center gap-3 text-left"
      >
        <span
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-[220ms] ${
            marcado ? "border-acento bg-acento-escuro" : "border-filete-forte"
          }`}
        >
          {marcado && (
            <Check
              className="entrada-check h-3.5 w-3.5 text-texto"
              strokeWidth={2}
            />
          )}
        </span>
        <span className="text-[16.5px] leading-[1.5] text-texto">
          {compromisso.texto}
        </span>
      </button>
    </form>
  );
}
