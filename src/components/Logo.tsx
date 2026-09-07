const VARIANTES = {
  topo: {
    texto: "text-sm",
    gap: "gap-1",
    barra1: "h-0.5 w-5",
    barra2: "h-0.5 w-8",
    opacidade: "opacity-75",
  },
  abertura: {
    texto: "text-3xl",
    gap: "gap-2",
    barra1: "h-1.5 w-10",
    barra2: "h-1.5 w-16",
    opacidade: "opacity-100",
  },
  rodape: {
    texto: "text-[10px]",
    gap: "gap-0.5",
    barra1: "h-px w-3",
    barra2: "h-px w-5",
    opacidade: "opacity-40",
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
        <span className={`${v.barra1} bg-acento`} />
        <span className={`${v.barra2} bg-acento`} />
      </span>
    </div>
  );
}
