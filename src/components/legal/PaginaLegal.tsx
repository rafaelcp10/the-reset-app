import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";

/**
 * Moldura das páginas públicas de privacidade e termos. Elas precisam
 * abrir para qualquer pessoa — inclusive para o Google, na tela de
 * consentimento — então não dependem de sessão nem de dados.
 */
export default function PaginaLegal({
  titulo,
  atualizadoEm,
  children,
}: {
  titulo: string;
  atualizadoEm: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[640px] grow flex-col gap-10 px-6 pb-16 pt-10">
      <Link href="/ritual" aria-label="Voltar ao app" className="self-start">
        <Logo variante="topo" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] leading-[1.25] text-texto">{titulo}</h1>
        <p className="tipo-rotulo text-[9.5px] tracking-[.18em] text-auxiliar">
          Atualizado em {atualizadoEm}
        </p>
      </div>

      <div className="flex flex-col gap-9">{children}</div>

      <div className="fio-luz" />

      <div className="flex flex-col gap-3 text-[13.5px]">
        <Link
          href="/privacidade"
          className="text-auxiliar underline underline-offset-4"
        >
          Privacidade
        </Link>
        <Link href="/termos" className="text-auxiliar underline underline-offset-4">
          Termos de uso
        </Link>
        <Link href="/ritual" className="text-auxiliar underline underline-offset-4">
          Voltar ao app
        </Link>
      </div>
    </div>
  );
}

export function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="tipo-rotulo text-[13px] tracking-[.18em] text-texto">
        {titulo}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.7] text-auxiliar">
        {children}
      </div>
    </section>
  );
}
