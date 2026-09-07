import type { EstadoSalvo } from "@/lib/ui/useEstadoSalvo";

export default function IndicadorSalvo({ estado }: { estado: EstadoSalvo }) {
  if (estado === "salvo") {
    return <span className="text-[11px] text-auxiliar-fraco">salvo</span>;
  }
  if (estado === "erro") {
    return (
      <span className="text-[11px] text-erro">não salvou, tenta de novo</span>
    );
  }
  return null;
}
