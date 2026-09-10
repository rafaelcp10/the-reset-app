import Link from "next/link";
import { Calendar, Settings } from "lucide-react";
import Logo from "@/components/Logo";

export default function Cabecalho({
  modo,
  nome,
  dataExtenso,
  numeroSemana,
}: {
  modo: "manha" | "noite";
  /** Primeiro nome, quando existe. Sem ele a saudação segue sozinha. */
  nome: string | null;
  dataExtenso: string;
  numeroSemana: number;
}) {
  const saudacao = modo === "manha" ? "Bom dia" : "Boa noite";
  return (
    <div className="flex flex-col gap-4">
      <Logo variante="topo" />

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xl leading-tight text-texto">
            {nome ? `${saudacao}, ${nome}.` : `${saudacao}.`}
          </p>
          <div className="flex items-center gap-4 text-auxiliar">
            <Link
              href="/semanas"
              aria-label="Semanas"
              className="-m-[13.5px] inline-flex p-[13.5px]"
            >
              <Calendar className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </Link>
            <Link
              href="/ajustes"
              aria-label="Ajustes"
              className="-m-[13.5px] inline-flex p-[13.5px]"
            >
              <Settings className="h-[17px] w-[17px]" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
        <p className="tipo-rotulo mt-1 text-[9.5px] tracking-[.18em] text-auxiliar">
          {dataExtenso} · semana {numeroSemana}
        </p>
      </div>
    </div>
  );
}
