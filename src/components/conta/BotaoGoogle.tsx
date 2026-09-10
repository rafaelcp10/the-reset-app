"use client";

import { useEffect, useState } from "react";
import { entrarComGoogle, vincularGoogle } from "@/lib/conta/google";
import { appInstalado } from "@/lib/ui/instalado";

/**
 * Um botão para dois usos que parecem iguais e não são: entrar numa conta
 * que já existe, ou grudar o Google na conta anônima atual sem perder o
 * que foi escrito.
 *
 * Dentro do app instalado ele não aparece: ali o Google sai e não
 * consegue voltar (ver `appInstalado`), e um botão que sempre falha é pior
 * que botão nenhum — a pessoa tenta, volta para o login sem explicação e
 * conclui que o app está quebrado.
 */
export default function BotaoGoogle({
  modo,
  rotulo,
}: {
  modo: "entrar" | "vincular";
  rotulo: string;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);
  const [instalado, setInstalado] = useState(false);

  useEffect(() => {
    // Só depois de montar: no servidor não existe janela para perguntar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInstalado(appInstalado());
  }, []);

  async function acionar() {
    setErro(null);
    setIndo(true);
    const resultado =
      modo === "entrar" ? await entrarComGoogle() : await vincularGoogle();
    if (resultado) {
      setErro(resultado.erro);
      setIndo(false);
    }
    // Sem erro o navegador sai para o Google; não há o que restaurar.
  }

  if (instalado) return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={acionar}
        disabled={indo}
        className="pilula tipo-rotulo flex w-full items-center justify-center gap-2.5 rounded-[10px] py-3.5 text-[13px] tracking-[.09em] text-texto disabled:opacity-50"
      >
        <MarcaGoogle />
        {indo ? "Abrindo" : rotulo}
      </button>

      {erro && <p className="text-[12.5px] leading-[1.5] text-erro">{erro}</p>}
    </div>
  );
}

/** O "G" oficial. É a única marca de terceiro no app, exigida pelo Google. */
function MarcaGoogle() {
  return (
    <svg
      className="h-[17px] w-[17px] shrink-0"
      viewBox="0 0 18 18"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
