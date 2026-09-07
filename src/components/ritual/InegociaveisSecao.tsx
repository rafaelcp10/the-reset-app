"use client";

import { useRef } from "react";
import { Check, X } from "lucide-react";
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
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-auxiliar">
          Inegociáveis
        </h2>
        {temSlotVazio && (
          <p className="mt-1 text-xs text-auxiliar/70">
            Só cabem 3 por semana — o que realmente importa.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
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
        placeholder={`Inegociável ${slot.ordem + 1} da semana`}
        className="bg-transparent py-3 text-lg text-texto outline-none placeholder:text-auxiliar/50"
      />
    );
  }

  const { compromisso, feitoHoje } = slot;
  const proximoFeito = feitoHoje !== true;
  const rotulo =
    feitoHoje === true
      ? "feito hoje"
      : feitoHoje === false
        ? "não feito hoje"
        : "ainda não marcado hoje";

  return (
    <form
      action={marcarCompromissoDia.bind(
        null,
        caminhoAtual,
        compromisso.id,
        dataHoje,
        proximoFeito,
      )}
    >
      <button
        type="submit"
        aria-label={`${compromisso.texto} — ${rotulo}`}
        className="flex w-full items-center gap-4 py-3 text-left"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
            feitoHoje === null ? "border-auxiliar/40" : "border-texto/60"
          }`}
        >
          {feitoHoje === true && (
            <Check className="h-4 w-4 text-texto" strokeWidth={2} />
          )}
          {feitoHoje === false && (
            <X className="h-4 w-4 text-auxiliar" strokeWidth={2} />
          )}
        </span>
        <span
          className={`text-lg ${feitoHoje === false ? "text-auxiliar" : "text-texto"}`}
        >
          {compromisso.texto}
        </span>
      </button>
    </form>
  );
}
