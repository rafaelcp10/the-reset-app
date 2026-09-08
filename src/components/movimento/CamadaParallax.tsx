"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Move o bloco mais devagar que a rolagem, criando distância entre planos.
 * O deslocamento é escrito direto no style como custom property, dentro de
 * um requestAnimationFrame — sem estado, sem re-render.
 */
export default function CamadaParallax({
  children,
  fator = 0.18,
  maximo = 90,
  className = "",
}: {
  children: ReactNode;
  /** Fração da rolagem aplicada ao bloco. Quanto menor, mais "ao fundo". */
  fator?: number;
  /** Teto do deslocamento, para o bloco nunca escapar do lugar. */
  maximo?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let quadro = 0;

    const atualizar = () => {
      quadro = 0;
      const deslocamento = Math.min(window.scrollY * fator, maximo);
      elemento.style.setProperty("--parallax-y", `${deslocamento}px`);
    };

    const aoRolar = () => {
      if (!quadro) quadro = requestAnimationFrame(atualizar);
    };

    atualizar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, [fator, maximo]);

  return (
    <div ref={ref} className={`camada-parallax ${className}`}>
      {children}
    </div>
  );
}
