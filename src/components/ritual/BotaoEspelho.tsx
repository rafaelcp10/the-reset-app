import Link from "next/link";
import { Maximize2 } from "lucide-react";

export default function BotaoEspelho({ modo }: { modo: "manha" | "noite" }) {
  return (
    <Link
      href="/ritual/espelho"
      className="botao-acento tipo-rotulo flex w-full items-center justify-center gap-2 rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
    >
      <Maximize2 className="h-4 w-4" strokeWidth={2} />
      {modo === "noite" ? "Entrar de novo" : "Entrar no espelho"}
    </Link>
  );
}
