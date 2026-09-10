"use client";

import { useActionState } from "react";
import { redefinirSenha, type EstadoConta } from "@/lib/conta/senha";

const INICIAL: EstadoConta = {};

/**
 * Aberta pelo link de recuperação: quando se chega aqui a sessão já existe,
 * então só falta escolher a senha nova.
 */
export default function RecuperarPage() {
  const [estado, acao, salvando] = useActionState(redefinirSenha, INICIAL);

  return (
    <div className="flex grow flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] leading-[1.3] text-texto">Nova senha</h1>
        <p className="text-[14px] leading-[1.6] text-auxiliar">
          Escolha uma senha e você já entra.
        </p>
      </div>

      <form action={acao} className="flex flex-col gap-4">
        <input
          type="password"
          name="senha"
          required
          minLength={8}
          autoComplete="new-password"
          enterKeyHint="done"
          placeholder="senha (mínimo 8 caracteres)"
          className="w-full border-b border-filete-media bg-transparent py-2 text-[16px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
        />

        {estado.erro && <p className="text-[12.5px] text-erro">{estado.erro}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
        >
          {salvando ? "Salvando" : "Salvar e entrar"}
        </button>
      </form>
    </div>
  );
}
