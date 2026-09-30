"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * Volta para de onde a pessoa veio.
 *
 * Um link fixo não serve em tela que se abre de mais de um lugar: o
 * histórico de um exercício se abre da sessão de treino e da Evolução, e
 * o "voltar" apontava sempre para a sessão — inclusive de um treino que
 * talvez nem exista mais. Sem histórico de navegação (a tela aberta direto
 * pelo endereço), cai no `reserva`.
 */
export default function Voltar({ reserva }: { reserva: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(reserva);
      }}
      className="-m-3 inline-flex self-start p-3 text-auxiliar"
    >
      <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
    </button>
  );
}
