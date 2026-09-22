import Link from "next/link";
import { Calendar, Settings } from "lucide-react";
import Logo from "@/components/Logo";

export default function Cabecalho({
  periodo,
  nome,
  dataExtenso,
  numeroSemana,
}: {
  /** A hora do relógio. A fase do ritual é outra coisa, e fica fora daqui. */
  periodo: "manha" | "tarde" | "noite";
  /** Primeiro nome, quando existe. Sem ele a saudação segue sozinha. */
  nome: string | null;
  dataExtenso: string;
  numeroSemana: number;
}) {
  const saudacao =
    periodo === "manha"
      ? "Bom dia"
      : periodo === "tarde"
        ? "Boa tarde"
        : "Boa noite";
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
              <Calendar className="h-[22px] w-[22px]" strokeWidth={1.5} />
            </Link>
            <Link
              href="/ajustes"
              aria-label="Ajustes"
              className="-m-[13.5px] inline-flex p-[13.5px]"
            >
              <Settings className="h-[22px] w-[22px]" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
        <p className="tipo-rotulo mt-1 text-[13.5px] tracking-[.1em] text-auxiliar">
          {dataExtenso} · semana {numeroSemana}
        </p>
      </div>
    </div>
  );
}
