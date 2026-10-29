"use client";

import { useOptimistic } from "react";
import { Check } from "lucide-react";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import { marcarCompromissoDia } from "@/lib/ritual/acoes";

/**
 * Um inegociável, marcável. O mesmo no Ritual e no To-do, com o tamanho de
 * cada tela.
 *
 * A marca acende no toque, e não quando o servidor responde e a tela
 * inteira recarrega — até 2026-10-29 era assim, e o quadrado ficava meio
 * segundo vazio depois do dedo, parecendo toque que não pegou. Se a
 * gravação falhar, a marca volta ao que o servidor tem.
 */
export default function LinhaInegociavel({
  slot,
  dataHoje,
  caminhoAtual,
  variante,
}: {
  slot: InegociavelSlot;
  dataHoje: string;
  caminhoAtual: string;
  variante: "ritual" | "todo";
}) {
  const { compromisso } = slot;
  const [marcado, marcar] = useOptimistic(slot.feitoHoje === true);
  if (!compromisso) return null;

  const todo = variante === "todo";

  async function alternar() {
    const proximo = !marcado;
    marcar(proximo);
    await marcarCompromissoDia(caminhoAtual, compromisso!.id, dataHoje, proximo);
  }

  return (
    <form action={alternar}>
      <button
        type="submit"
        aria-label={`${compromisso.texto} — ${marcado ? "feito hoje" : "não marcado"}`}
        className={`flex w-full items-center text-left ${todo ? "min-h-14 gap-4" : "min-h-12 gap-3"}`}
      >
        <span
          className={`flex shrink-0 items-center justify-center border transition-colors ${
            todo
              ? "h-[24px] w-[24px] rounded-[5px] duration-[250ms]"
              : "h-[22px] w-[22px] rounded-[4px] duration-[220ms]"
          } ${marcado ? "border-acento bg-acento-escuro" : "border-filete-forte"}`}
        >
          {marcado && (
            <Check
              className={`entrada-check text-texto ${todo ? "h-5 w-5" : "h-[18px] w-[18px]"}`}
              strokeWidth={2}
            />
          )}
        </span>
        <span
          className={
            todo
              ? `font-frase text-[18px] leading-[1.5] ${marcado ? "text-auxiliar" : "text-texto"}`
              : "text-[16.5px] leading-[1.5] text-texto"
          }
        >
          {compromisso.texto}
        </span>
      </button>
    </form>
  );
}
