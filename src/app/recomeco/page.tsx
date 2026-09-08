import Link from "next/link";
import Revelar from "@/components/movimento/Revelar";
import FraseRevelada from "@/components/movimento/FraseRevelada";

export default function RecomecoPage() {
  return (
    <div className="flex grow flex-col justify-between px-6 pb-10 pt-16">
      {/* Quem chega aqui sumiu por dias. A frase precisa chegar devagar,
          como quem fala baixo — por isso a entrada é lenta e sem susto. */}
      <div className="flex flex-col gap-3">
        <FraseRevelada
          antes="Você voltou. A gente começa daqui."
          className="text-[30px] leading-[1.3] text-texto"
          atrasoInicial={260}
          passo={60}
        />
        <Revelar imediato atraso={1250} y={14} desfoque={5}>
          <p className="text-[19px] leading-[1.5] text-auxiliar">
            Não tem nada para recuperar. O único dia aberto é hoje.
          </p>
        </Revelar>
      </div>

      <Revelar imediato atraso={1900} className="flex flex-col gap-4">
        <Link
          href="/ritual"
          className="botao-acento tipo-rotulo block w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Abrir o ritual de hoje
        </Link>
        <Link
          href="/ritual?editarIdentidade=1"
          className="text-center text-[13.5px] text-auxiliar underline underline-offset-4"
        >
          trocar a palavra da frase 1
        </Link>
      </Revelar>
    </div>
  );
}
