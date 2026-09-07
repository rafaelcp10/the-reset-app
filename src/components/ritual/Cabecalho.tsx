import { Calendar, Settings } from "lucide-react";
import Logo from "@/components/Logo";

export default function Cabecalho({
  modo,
  dataExtenso,
  numeroSemana,
}: {
  modo: "manha" | "noite";
  dataExtenso: string;
  numeroSemana: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Logo />

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-frase text-2xl">
            {modo === "manha" ? "Bom dia." : "Boa noite."}
          </p>
          <div className="flex items-center gap-4 text-auxiliar/50">
            <Calendar className="h-5 w-5" strokeWidth={1.5} />
            <Settings className="h-5 w-5" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-sm uppercase tracking-wide text-auxiliar">
          {dataExtenso} · Semana {numeroSemana}
        </p>
      </div>
    </div>
  );
}
