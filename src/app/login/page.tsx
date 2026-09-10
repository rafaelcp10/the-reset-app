"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import BotaoGoogle from "@/components/conta/BotaoGoogle";
import { appInstalado } from "@/lib/ui/instalado";
import {
  entrarComSenha,
  pedirRecuperacao,
  type EstadoConta,
} from "@/lib/conta/senha";

const INICIAL: EstadoConta = {};

const CAMPO =
  "w-full border-b border-filete-media bg-transparent py-2 text-[16px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro";

export default function LoginPage() {
  const [esqueci, setEsqueci] = useState(false);
  const [estado, acaoEntrar, entrando] = useActionState(entrarComSenha, INICIAL);
  const [recuperacao, acaoRecuperar, recuperando] = useActionState(
    pedirRecuperacao,
    INICIAL,
  );
  const [instalado, setInstalado] = useState(false);
  const [erroRetorno, setErroRetorno] = useState<string | null>(null);

  useEffect(() => {
    // Lido da janela, e não por useSearchParams, para esta página seguir
    // sendo estática — e porque aqui isso é um aviso, não roteamento.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstalado(appInstalado());
    const motivo = new URLSearchParams(window.location.search).get("erro");
    if (motivo === "google_sem_volta") {
      setErroRetorno(
        "O Google confirmou, mas o retorno se perdeu no caminho de volta para o app. Entre com e-mail e senha.",
      );
    } else if (motivo) {
      setErroRetorno("Esse link não vale mais. Entre com e-mail e senha.");
    }
  }, []);

  if (esqueci) {
    return (
      <div className="flex grow flex-col justify-center gap-6 px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[26px] leading-[1.3] text-texto">
            Recuperar o acesso
          </h1>
          <p className="text-[14px] leading-[1.6] text-auxiliar">
            Mandamos um link para você definir uma senha nova.
          </p>
        </div>

        {recuperacao.aviso ? (
          <p className="text-[15px] leading-[1.6] text-texto">
            {recuperacao.aviso}
          </p>
        ) : (
          <form action={acaoRecuperar} className="flex flex-col gap-4">
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              inputMode="email"
              enterKeyHint="done"
              placeholder="seu e-mail"
              className={CAMPO}
            />
            {recuperacao.erro && (
              <p className="text-[12.5px] text-erro">{recuperacao.erro}</p>
            )}
            <button
              type="submit"
              disabled={recuperando}
              className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
            >
              {recuperando ? "Enviando" : "Enviar link"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => setEsqueci(false)}
          className="self-center text-[13px] text-auxiliar underline underline-offset-4"
        >
          voltar
        </button>
      </div>
    );
  }

  return (
    <div className="flex grow flex-col justify-center gap-7 px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-[26px] leading-[1.3] text-texto">Entrar</h1>
        <p className="text-[14px] leading-[1.6] text-auxiliar">
          Suas frases, suas gravações e seu histórico voltam com você.
        </p>
      </div>

      {erroRetorno && (
        <p className="text-[12.5px] leading-[1.5] text-erro">{erroRetorno}</p>
      )}

      {/* No app instalado o Google não tem como voltar, então nem aparece:
          lá o caminho é e-mail e senha. No navegador ele continua valendo. */}
      {!instalado && (
        <>
          <BotaoGoogle modo="entrar" rotulo="Entrar com Google" />

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-filete-media" />
            <span className="tipo-rotulo text-[10px] tracking-[.18em] text-auxiliar-minimo">
              ou
            </span>
            <span className="h-px flex-1 bg-filete-media" />
          </div>
        </>
      )}

      <form action={acaoEntrar} className="flex flex-col gap-4">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="seu e-mail"
          className={CAMPO}
        />
        <input
          type="password"
          name="senha"
          required
          autoComplete="current-password"
          enterKeyHint="done"
          placeholder="sua senha"
          className={CAMPO}
        />

        {estado.erro && <p className="text-[12.5px] text-erro">{estado.erro}</p>}

        <button
          type="submit"
          disabled={entrando}
          className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
        >
          {entrando ? "Entrando" : "Entrar com senha"}
        </button>
      </form>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setEsqueci(true)}
          className="text-[13px] text-auxiliar underline underline-offset-4"
        >
          esqueci minha senha
        </button>
        <Link
          href="/onboarding/abertura"
          className="text-[13px] text-auxiliar-fraco underline underline-offset-4"
        >
          ainda não tenho conta
        </Link>
      </div>
    </div>
  );
}
