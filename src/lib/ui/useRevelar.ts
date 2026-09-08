"use client";

import { useEffect, useRef } from "react";

/**
 * Marca o elemento com `visivel` na primeira vez que ele entra na tela.
 * Toda a animação vive no CSS; aqui não há estado, então rolar a página
 * não dispara render nenhum.
 */
export function useRevelar<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    if (typeof IntersectionObserver === "undefined") {
      elemento.classList.add("visivel");
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return ref;
}
