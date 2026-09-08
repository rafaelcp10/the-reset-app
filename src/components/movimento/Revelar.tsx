"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRevelar } from "@/lib/ui/useRevelar";

/**
 * Revela o bloco quando ele entra na área visível — sobe, ganha foco e
 * clareia. A animação está em `.revelar` (globals.css).
 */
export default function Revelar({
  children,
  atraso = 0,
  y = 22,
  escala = 1,
  desfoque = 6,
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
      className={`${imediato ? "revelar-imediato" : "revelar"} ${className}`}
      style={
        {
          "--revelar-atraso": `${atraso}ms`,
          "--revelar-y": `${y}px`,
          "--revelar-escala": escala,
          "--revelar-desfoque": `${desfoque}px`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
