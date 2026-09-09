import Link from "next/link";
import Logo from "@/components/Logo";
import Revelar from "@/components/movimento/Revelar";
import FraseRevelada from "@/components/movimento/FraseRevelada";

export default function AberturaPage() {
  return (
    <div className="flex grow flex-col justify-between px-6 pb-10 pt-10">
      <Revelar imediato y={12} desfoque={4}>
        <Logo variante="abertura" />
      </Revelar>

      {/* O manifesto entra palavra a palavra: é a primeira coisa que a
          pessoa lê no app, e precisa chegar no ritmo de quem fala devagar. */}
      <div className="flex flex-col gap-6">
        <FraseRevelada
          antes="De manhã você põe a música, lê cinco frases em voz alta e escreve uma linha: o que vai fazer hoje."
          className="text-2xl leading-relaxed text-texto"
          atrasoInicial={420}
          passo={38}
        />
        <FraseRevelada
          antes="De noite você abre a mesma tela e marca o que fez. Cinco minutos."
          className="text-2xl leading-relaxed text-auxiliar"
          atrasoInicial={1500}
          passo={34}
        />
      </div>

      <Revelar imediato atraso={2400} y={16} className="flex flex-col gap-4">
        <Link
          href="/onboarding/identidade"
          className="botao-acento tipo-rotulo block w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Começar
        </Link>

        {/* Quem instalou o app num aparelho novo cai aqui como se fosse a
            primeira vez — a sessão instalada não enxerga a do navegador.
            Sem esta saída, a pessoa recomeçaria do zero sem entender. */}
        <Link
          href="/login"
          className="self-center text-[13.5px] text-auxiliar underline underline-offset-4"
        >
          já tenho conta
        </Link>
      </Revelar>
    </div>
  );
}
