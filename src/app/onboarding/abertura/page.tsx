import Link from "next/link";
import Logo from "@/components/Logo";

export default function AberturaPage() {
  return (
    <div className="flex flex-1 flex-col justify-between px-6 pb-10 pt-10">
      <Logo variante="abertura" />

      <div className="flex flex-col gap-6">
        <p className="text-2xl leading-relaxed text-texto">
          De manhã você põe a música, lê cinco frases em voz alta e escreve
          uma linha: o que vai fazer hoje.
        </p>
        <p className="text-2xl leading-relaxed text-texto">
          De noite você abre a mesma tela e marca o que fez. Cinco minutos.
        </p>
      </div>

      <Link
        href="/onboarding/identidade"
        className="tipo-rotulo w-full rounded-[6px] bg-acento py-3 text-center text-[16px] tracking-[.09em] text-fundo"
      >
        Começar
      </Link>
    </div>
  );
}
