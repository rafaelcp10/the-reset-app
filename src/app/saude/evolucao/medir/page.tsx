import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import Revelar from "@/components/movimento/Revelar";

/**
 * Como passar a fita.
 *
 * Tudo em texto: o app não tem imagem em tela nenhuma, e aqui isso é
 * restrição de verdade — um desenho de onde fica a cintura ajudaria. A
 * saída foi escrever cada medida como uma instrução única e curta, na
 * ordem em que a mão faz.
 *
 * Nenhuma linha explica por que a conta funciona. O que interessa é medir
 * do mesmo jeito toda vez: repetido igual, o erro é o mesmo em todas as
 * semanas, e a diferença entre duas delas continua verdadeira.
 */

const PASSOS = [
  {
    titulo: "Quando",
    texto:
      "De manhã, antes de comer e beber, depois do banheiro. O mesmo dia da semana, sempre. A hora certa importa menos do que ser sempre a mesma.",
  },
  {
    titulo: "A fita",
    texto:
      "Encostada na pele, sem folga e sem apertar — se marcar a pele, está apertada demais. Ombros soltos, respiração normal, sem prender o ar nem estufar o peito.",
  },
  {
    titulo: "Pescoço",
    texto:
      "Logo abaixo do pomo de adão, com a fita um pouco mais baixa na frente do que atrás. Olhe para a frente, sem esticar nem encolher o pescoço.",
  },
  {
    titulo: "Cintura",
    texto:
      "Na altura do umbigo, com a fita paralela ao chão — confira no espelho. Solte o ar como sempre e meça sem puxar a barriga.",
  },
  {
    titulo: "Quadril",
    texto:
      "Só entra na versão feminina da conta. Pés juntos, fita na parte mais larga dos glúteos, paralela ao chão.",
  },
  {
    titulo: "Anotar",
    texto:
      "Arredonde para o meio centímetro mais próximo. Meça duas vezes; se der diferente, meça a terceira e use o número que apareceu duas vezes.",
  },
];

export default function ComoMedirPage() {
  return (
    <div className="flex grow flex-col gap-8 px-5 pb-10 pt-6">
      <Link
        href="/saude/evolucao"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={14} desfoque={4} className="flex flex-col gap-3 px-1">
        <h1 className="text-[26px] leading-tight text-texto">Como medir</h1>
        <p className="text-[16.5px] leading-[1.6] text-auxiliar">
          Uma fita métrica de costura e três minutos. Nada além disso.
        </p>
      </Revelar>

      <div className="flex flex-col gap-3">
        {PASSOS.map((passo, indice) => (
          <Revelar
            key={passo.titulo}
            imediato={indice < 3}
            atraso={80 + indice * 50}
          >
            <div className="bloco flex flex-col gap-2 px-4 py-4">
              <h2 className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar">
                {passo.titulo}
              </h2>
              <p className="text-[16.5px] leading-[1.6] text-texto">
                {passo.texto}
              </p>
            </div>
          </Revelar>
        ))}
      </div>

      <Revelar atraso={60} className="px-1">
        <p className="text-[15.5px] leading-[1.6] text-auxiliar">
          Medir sempre do mesmo jeito vale mais do que medir com precisão. O
          que esta tela guarda é a distância entre duas semanas, e para isso a
          régua só precisa ser a mesma.
        </p>
      </Revelar>

      <Revelar atraso={120}>
        <Link
          href="/saude/evolucao"
          className="botao-acento tipo-rotulo block w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Anotar as medidas
        </Link>
      </Revelar>
    </div>
  );
}
