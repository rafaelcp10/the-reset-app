import Link from "next/link";

export default function RecomecoPage() {
  return (
    <div className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-[30px] leading-[1.3] text-texto">
          Você voltou. A gente começa daqui.
        </h1>
        <p className="text-[19px] leading-[1.5] text-auxiliar">
          Não tem nada para recuperar. O único dia aberto é hoje.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Link
          href="/ritual"
          className="tipo-rotulo w-full rounded-[6px] bg-acento py-3 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Abrir o ritual de hoje
        </Link>
        <Link
          href="/ritual?editarIdentidade=1"
          className="text-center text-[13.5px] text-auxiliar underline underline-offset-4"
        >
          trocar a palavra da frase 1
        </Link>
      </div>
    </div>
  );
}
