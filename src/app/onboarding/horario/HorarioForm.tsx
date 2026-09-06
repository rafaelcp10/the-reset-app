"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { salvarHorario, type EstadoHorario } from "./actions";

const ESTADO_INICIAL: EstadoHorario = {};

function BotaoContinuar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo disabled:opacity-40"
    >
      {pending ? "Salvando..." : "Continuar"}
    </button>
  );
}

export default function HorarioForm({
  horarioInicial,
}: {
  horarioInicial: string;
}) {
  const [estado, formAction] = useActionState(salvarHorario, ESTADO_INICIAL);
  const fusoRef = useRef<HTMLInputElement>(null);

  // Fuso é lido do navegador, nunca renderizado — evita mismatch de
  // hidratação (servidor não conhece o fuso do usuário).
  useEffect(() => {
    if (fusoRef.current) {
      fusoRef.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }, []);

  return (
    <form
      action={formAction}
      className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16"
    >
      <div>
        <h1 className="font-frase text-2xl leading-relaxed">
          Que horas você quer confirmar o dia?
        </h1>
        <p className="mt-3 text-sm text-auxiliar">
          Toda noite, nesse horário, avisamos para você confirmar em poucos
          segundos o que fez.
        </p>

        <input
          type="time"
          name="horario"
          defaultValue={horarioInicial}
          required
          style={{ colorScheme: "dark" }}
          className="mt-10 w-full bg-transparent text-center font-frase text-4xl text-texto outline-none"
        />
        <input type="hidden" name="fuso" ref={fusoRef} defaultValue="" />
      </div>

      <div className="flex flex-col gap-3">
        {estado.erro && <p className="text-sm text-auxiliar">{estado.erro}</p>}
        <BotaoContinuar />
      </div>
    </form>
  );
}
