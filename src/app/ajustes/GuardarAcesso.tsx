"use client";

import { useActionState } from "react";
import Link from "next/link";
import { vincularEmail, type EstadoVinculo } from "@/lib/conta/acoes";

const INICIAL: EstadoVinculo = { status: "idle" };

export default function GuardarAcesso({
  emailAtual,
  confirmado,
}: {
  emailAtual: string | null;
  /** E-mail já verificado — a conta é recuperável de verdade. */
  confirmado: boolean;
}) {
  const [estado, acao, enviando] = useActionState(vincularEmail, INICIAL);

  if (confirmado && emailAtual) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Seu acesso
        </h2>
        <p className="text-[14px] leading-[1.6] text-auxiliar">
          Guardado em <span className="text-texto">{emailAtual}</span>. Se
          trocar de aparelho, entre com esse e-mail e tudo volta.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
        Guardar seu acesso
      </h2>

      <p className="text-[13.5px] leading-[1.6] text-auxiliar">
        Hoje tudo o que você escreveu vive só neste navegador. Limpar os
        dados ou trocar de celular apaga as frases, as gravações e o
        histórico. Um e-mail resolve isso — serve só para trazer você de
        volta.
      </p>

      {estado.status === "enviado" ? (
        <p className="text-[14px] leading-[1.6] text-texto">
          Enviamos um link de confirmação. Abra pelo mesmo aparelho e o
          acesso fica guardado.
        </p>
      ) : (
        <form action={acao} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            defaultValue={emailAtual ?? ""}
            required
            autoComplete="email"
            inputMode="email"
            enterKeyHint="done"
            placeholder="seu e-mail"
            className="w-full border-b border-filete-media bg-transparent py-2 text-[16px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
          />

          {estado.status === "erro" && (
            <p className="text-[12.5px] leading-[1.5] text-erro">
              {estado.mensagem}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="pilula tipo-rotulo self-start rounded-[8px] px-5 py-2.5 text-[12px] tracking-[.09em] text-texto disabled:opacity-50"
          >
            {enviando ? "Enviando" : "Guardar"}
          </button>
        </form>
      )}

      {emailAtual && !confirmado && (
        <p className="text-[13px] leading-[1.6] text-auxiliar">
          Falta confirmar <span className="text-texto">{emailAtual}</span>{" "}
          pelo link que enviamos.
        </p>
      )}

      <Link
        href="/login"
        className="text-[13px] text-auxiliar underline underline-offset-4"
      >
        já tenho conta em outro aparelho
      </Link>
    </section>
  );
}
