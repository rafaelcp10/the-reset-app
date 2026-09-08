const VARIANTES = {
  topo: {
    texto: "text-[19px]",
    gap: "gap-1.5",
    barra1: "h-[3px] w-7",
    barra2: "h-[3px] w-11",
    opacidade: "opacity-100",
  },
  abertura: {
    texto: "text-4xl",
    gap: "gap-2.5",
    barra1: "h-[5px] w-12",
    barra2: "h-[5px] w-20",
    opacidade: "opacity-100",
  },
  rodape: {
    texto: "text-[11px]",
    gap: "gap-1",
    barra1: "h-px w-3.5",
    barra2: "h-px w-6",
    opacidade: "opacity-45",
  },
} as const;

export default function Logo({
  variante = "topo",
}: {
  variante?: keyof typeof VARIANTES;
}) {
  const v = VARIANTES[variante];
  return (
    <div className={`tipo-rotulo inline-flex flex-col items-start ${v.gap} ${v.opacidade}`}>
      <span className={`${v.texto} font-bold leading-none tracking-tight text-texto`}>
        The Reset
      </span>
      <span className="flex gap-1">
        <span className={`${v.barra1} rounded-full bg-acento`} />
        <span className={`${v.barra2} rounded-full bg-acento`} />
      </span>
    </div>
  );
}
