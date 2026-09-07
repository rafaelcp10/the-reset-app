import Link from "next/link";
import { Maximize2 } from "lucide-react";

export default function BotaoEspelho() {
  return (
    <Link
      href="/ritual/espelho"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo"
    >
      <Maximize2 className="h-4 w-4" strokeWidth={2} />
      Entrar no espelho
    </Link>
  );
}
