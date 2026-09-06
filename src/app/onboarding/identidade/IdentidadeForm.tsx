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
      className="w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo disabled:opacity-40"
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
      className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16"
    >
      <p className="font-frase text-2xl leading-relaxed">
        {antes}
        <input
          type="text"
          name="preenchimento"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="______"
          autoFocus
          className="mx-1 w-40 border-b-2 border-acento bg-transparent text-center text-acento outline-none placeholder:text-acento/40"
        />
        {depois}
      </p>

      <div className="flex flex-col gap-3">
        {estado.erro && <p className="text-sm text-auxiliar">{estado.erro}</p>}
        <BotaoContinuar desabilitado={valor.trim().length === 0} />
      </div>
    </form>
  );
}
