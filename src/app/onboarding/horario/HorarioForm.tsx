"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { salvarHorario, type EstadoHorario } from "./actions";

const ESTADO_INICIAL: EstadoHorario = {};
const OPCOES_HORARIO = ["20:30", "21:00", "21:30", "22:00", "22:30"] as const;

function BotaoContinuar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="tipo-rotulo w-full rounded-[6px] bg-acento py-3 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-40"
    >
      {pending ? "Salvando..." : "Ver o meu ritual"}
    </button>
  );
}

export default function HorarioForm({
  horarioInicial,
}: {
  horarioInicial: string;
}) {
  const [estado, formAction] = useActionState(salvarHorario, ESTADO_INICIAL);
  const [horario, setHorario] = useState(
    (OPCOES_HORARIO as readonly string[]).includes(horarioInicial)
      ? horarioInicial
      : "21:30",
  );
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
      className="flex flex-1 flex-col justify-between px-6 pb-10 pt-10"
    >
      <div>
        <h1 className="text-[24px] leading-[1.4] text-texto">
          Que horas você fecha o dia?
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.6] text-auxiliar">
          À noite a mesma tela pede quatro toques: os três inegociáveis e a
          linha do dia.
        </p>

        <div className="mt-10 flex flex-col gap-2">
          {OPCOES_HORARIO.map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setHorario(opcao)}
              className={`tipo-rotulo rounded-[6px] py-3 text-center text-[16px] tracking-[.09em] ${
                horario === opcao
                  ? "bg-superficie3 text-texto"
                  : "bg-superficie2 text-texto"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
        <input type="hidden" name="horario" value={horario} />
        <input type="hidden" name="fuso" ref={fusoRef} defaultValue="" />
      </div>

      <div className="flex flex-col gap-3">
        {estado.erro && <p className="text-sm text-auxiliar">{estado.erro}</p>}
        <BotaoContinuar />
      </div>
    </form>
  );
}
