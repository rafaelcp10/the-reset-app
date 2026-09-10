"use client";

import Link from "next/link";
import { sairDaConta } from "@/lib/conta/sessao";

/**
 * Quem é a conta aberta neste aparelho, e como sair dela.
 *
 * O e-mail aparece sempre que existe — é a única coisa na tela que
 * responde "estou conectado como quem?". Antes ele só aparecia depois de
 * confirmado, então quem entrava com senha e olhava aqui não encontrava
 * o próprio endereço.
 *
 * O bloco de "guardar por link de e-mail" saiu daqui: o link abre no
 * navegador e chuta a pessoa para fora do app instalado. Quem ainda está
 * numa conta anônima vai para a mesma tela de criar conta do onboarding,
 * que converte a conta preservando tudo que já foi escrito.
 */
export default function GuardarAcesso({
  emailAtual,
  confirmado,
}: {
  emailAtual: string | null;
  /** E-mail já verificado — a conta é recuperável de verdade. */
  confirmado: boolean;
}) {
  if (!emailAtual) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Guardar seu acesso
        </h2>

        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          Tudo o que você escreveu vive só neste aparelho. Limpar os dados ou
          trocar de celular apaga as frases, as gravações e o histórico. Uma
          conta resolve isso — e nada do que já está aqui se perde.
        </p>

        <Link
          href="/onboarding/conta"
          className="botao-acento tipo-rotulo self-start rounded-[10px] px-6 py-3.5 text-[14px] tracking-[.09em] text-fundo"
        >
          Criar conta
        </Link>

        <Link
          href="/login"
          className="text-[13px] text-auxiliar underline underline-offset-4"
        >
          já tenho conta em outro aparelho
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
        Seu acesso
      </h2>

      <p className="text-[14px] leading-[1.6] text-auxiliar">
        Conectado como <span className="text-texto">{emailAtual}</span>. Se
        trocar de aparelho, entre com esse e-mail e tudo volta.
      </p>

      {!confirmado && (
        <p className="text-[13px] leading-[1.6] text-auxiliar-fraco">
          Falta confirmar esse endereço pelo link que enviamos.
        </p>
      )}

      {/* Sair fica separado de "apagar minha conta" por um bom espaço: um
          guarda tudo e o outro não tem volta. */}
      <form action={sairDaConta} className="mt-2">
        <button
          type="submit"
          className="text-[13.5px] text-auxiliar underline underline-offset-4"
        >
          sair desta conta
        </button>
      </form>
    </section>
  );
}
