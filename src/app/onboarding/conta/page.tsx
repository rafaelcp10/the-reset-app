"use client";

import { useActionState } from "react";
import Link from "next/link";
import Revelar from "@/components/movimento/Revelar";
import { criarConta, type EstadoConta } from "@/lib/conta/senha";

const INICIAL: EstadoConta = {};

export default function ContaPage() {
  const [estado, acao, enviando] = useActionState(criarConta, INICIAL);

  return (
    <div className="flex grow flex-col justify-between px-6 pb-10 pt-10">
      <Revelar imediato y={14} className="flex flex-col gap-3">
        <h1 className="text-[26px] leading-[1.3] text-texto">
          Agora guarde o que você escreveu.
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-auxiliar">
          Sem uma conta, tudo isso vive só neste aparelho — e some se você
          limpar o navegador ou trocar de celular. Leva vinte segundos.
        </p>
      </Revelar>

      <Revelar imediato atraso={140} className="flex flex-col gap-6">
        <form action={acao} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            inputMode="email"
            placeholder="seu e-mail"
            className="w-full border-b border-filete-media bg-transparent py-2 text-[16px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
          />
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

          {estado.erro && (
            <p className="text-[12.5px] leading-[1.5] text-erro">{estado.erro}</p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
          >
            {enviando ? "Criando" : "Criar conta"}
          </button>
        </form>

        {/* Aqui não existe entrada pelo Google, e não é por preguiça.
            Neste ponto tudo que a pessoa escreveu no onboarding está numa
            conta anônima, e é `criarConta` que converte essa conta em
            definitiva, com o texto junto. Entrar pelo Google faria o
            contrário: abriria uma conta nova, vazia, e abandonaria a
            anterior — o onboarding inteiro perdido sem um aviso. */}

        <Link
          href="/login"
          className="self-center text-[13px] text-auxiliar underline underline-offset-4"
        >
          já tenho conta
        </Link>
      </Revelar>
    </div>
  );
}
