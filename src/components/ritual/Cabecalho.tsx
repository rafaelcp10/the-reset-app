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
    <div className="flex flex-col gap-1">
      <p className="font-frase text-2xl">
        {modo === "manha" ? "Bom dia." : "Boa noite."}
      </p>
      <p className="text-sm text-auxiliar">
        {dataExtenso} · Semana {numeroSemana}
      </p>
    </div>
  );
}
