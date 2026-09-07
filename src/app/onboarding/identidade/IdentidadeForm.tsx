"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { dividirNaLacuna } from "@/lib/frases/modelo";
import { salvarIdentidade, type EstadoIdentidade } from "./actions";

const ESTADO_INICIAL: EstadoIdentidade = {};

function BotaoContinuar({ desabilitado }: { desabilitado: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={desabilitado || pending}
      className={`tipo-rotulo w-full rounded-[6px] py-3 text-center text-[16px] tracking-[.09em] ${
        desabilitado || pending
          ? "bg-[#1C1E22] text-auxiliar-minimo"
          : "bg-acento text-fundo"
      }`}
    >
      {pending ? "Salvando..." : "Continuar"}
    </button>
  );
}

export default function IdentidadeForm({
  textoBase,
  valorInicial,
}: {
  textoBase: string;
  valorInicial: string;
}) {
  const [estado, formAction] = useActionState(salvarIdentidade, ESTADO_INICIAL);
  const [valor, setValor] = useState(valorInicial);
  const [antes, depois] = dividirNaLacuna(textoBase);

  return (
    <form
      action={formAction}
      className="flex flex-1 flex-col justify-between px-6 pb-10 pt-10"
    >
      <div className="flex flex-col gap-4">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar">
          Identidade
        </span>
        <p className="text-[28px] leading-[1.5] text-texto">
          {antes}
          <input
            type="text"
            name="preenchimento"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="______"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            className="mx-1 w-40 border-b-2 border-acento bg-acento-escuro text-center text-acento outline-none placeholder:text-acento/40"
          />
          {depois}
        </p>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          A única coisa que o app pede de você. Uma palavra basta — e ela
          pode mudar amanhã.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {estado.erro && <p className="text-sm text-auxiliar">{estado.erro}</p>}
        <BotaoContinuar desabilitado={valor.trim().length === 0} />
      </div>
    </form>
  );
}
