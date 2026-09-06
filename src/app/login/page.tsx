"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enviarLinkMagico, type EstadoLogin } from "./actions";

const ESTADO_INICIAL: EstadoLogin = { status: "idle" };

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo disabled:opacity-50"
    >
      {pending ? "Enviando..." : "Enviar link mágico"}
    </button>
  );
}

export default function LoginPage() {
  const [estado, formAction] = useActionState(enviarLinkMagico, ESTADO_INICIAL);

  if (estado.status === "enviado") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-frase text-xl">Verifique seu e-mail.</p>
        <p className="mt-3 text-sm text-auxiliar">
          Mandamos um link para você entrar. Pode fechar esta aba.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6">
      <h1 className="font-frase text-2xl">Entrar</h1>
      <p className="mt-2 text-sm text-auxiliar">
        Digite seu e-mail e mandamos um link para entrar, sem senha.
      </p>

      <form action={formAction} className="mt-8 flex flex-col gap-3">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="rounded-lg bg-transparent border-b border-auxiliar/40 py-3 text-texto placeholder:text-auxiliar/60 outline-none focus:border-acento"
        />
        {estado.status === "erro" && (
          <p className="text-sm text-auxiliar">{estado.mensagem}</p>
        )}
        <BotaoEnviar />
      </form>
    </div>
  );
}
