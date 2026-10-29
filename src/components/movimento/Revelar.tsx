"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRevelar } from "@/lib/ui/useRevelar";

/**
 * Revela o bloco quando ele entra na área visível — sobe e clareia. A
 * animação está em `.revelar` (globals.css).
 *
 * **Bloco entra sem desfoque, e em 420 ms** (2026-10-29). Eram 760 ms com
 * desfoque em todos: cada tela levava quase um segundo para assentar, e
 * isso se sente como lentidão mesmo com os dados já na mão. E animar
 * `filter` em vários painéis grandes de uma vez pesa em celular simples.
 * O desfoque ficou só onde é pedido — os títulos, que são pequenos.
 */
export default function Revelar({
  children,
  atraso = 0,
  y = 16,
  escala = 1,
  desfoque = 0,
  imediato = false,
  className = "",
}: {
  children: ReactNode;
  /** Espera antes de entrar, em ms — escalona blocos vizinhos. */
  atraso?: number;
  y?: number;
  escala?: number;
  desfoque?: number;
  /**
   * Para blocos acima da dobra: entra por animação CSS assim que a página
   * pinta, sem esperar hidratação. Abaixo da dobra deve ficar `false`,
   * senão a entrada acontece longe dos olhos.
   */
  imediato?: boolean;
  className?: string;
}) {
  const ref = useRevelar<HTMLDivElement>();

  return (
    <div
      ref={imediato ? undefined : ref}
      className={`${imediato ? "revelar-imediato" : "revelar"}${desfoque > 0 ? " revelar-desfoque" : ""} ${className}`}
      style={
        {
          "--revelar-atraso": `${atraso}ms`,
          "--revelar-y": `${y}px`,
          "--revelar-escala": escala,
          ...(desfoque > 0 ? { "--revelar-desfoque": `${desfoque}px` } : {}),
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
