"use client";

import { useCallback, useRef, useState } from "react";

export type EstadoSalvo = "idle" | "salvo" | "erro";

/**
 * Feedback discreto de "salvo automaticamente" — sem toast, sem botão de
 * salvar. `erro` é o único lugar do app onde cabe vermelho (ver CLAUDE.md:
 * vermelho só para erro de sistema, nunca comportamento do usuário).
 */
export function useEstadoSalvo() {
  const [estado, setEstado] = useState<EstadoSalvo>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const executar = useCallback((promessa: Promise<unknown>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    promessa
      .then(() => {
        setEstado("salvo");
        timeoutRef.current = setTimeout(() => setEstado("idle"), 1500);
      })
      .catch(() => {
        setEstado("erro");
        timeoutRef.current = setTimeout(() => setEstado("idle"), 2500);
      });
  }, []);

  return [estado, executar] as const;
}
