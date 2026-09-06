import Link from "next/link";

export default function AberturaPage() {
  return (
    <div className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16">
      <p className="font-frase text-2xl leading-relaxed">
        Toda manhã, você lê cinco frases em voz alta e escreve uma linha
        sobre o que vai fazer hoje. Toda noite, você confirma se cumpriu —
        sem nota, sem sequência perfeita, só o registro do que foi real.
      </p>

      <Link
        href="/onboarding/identidade"
        className="w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo"
      >
        Começar
      </Link>
    </div>
  );
}
