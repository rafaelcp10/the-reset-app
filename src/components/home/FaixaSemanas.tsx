import type { FaixaSemana } from "@/lib/home/dados";

const MAX_SEMANAS_VISIVEIS = 12;

export default function FaixaSemanas({
  faixaSemanas,
}: {
  faixaSemanas: FaixaSemana[];
}) {
  const semanas = faixaSemanas.slice(-MAX_SEMANAS_VISIVEIS);

  return (
    <div className="flex h-[34px] items-end gap-[5px]">
      {semanas.map((semana) => {
        const altura =
          semana.diasRespondidos === 0 ? 0 : 8 + semana.diasRespondidos * 3.6;
        return (
          <span
            key={semana.semanaInicio}
            style={{ height: `${altura}px` }}
            className="w-[6px] shrink-0 bg-acento"
          />
        );
      })}
    </div>
  );
}
