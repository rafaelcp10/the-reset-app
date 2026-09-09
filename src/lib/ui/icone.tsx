import type { ReactElement } from "react";

/**
 * O ícone do app é a assinatura da marca — os dois filetes âmbar sobre
 * grafite. Sem texto de propósito: assim não depende de carregar fonte e
 * continua legível no tamanho de um ícone de tela de início.
 */
export function desenharIcone(tamanho: number): ReactElement {
  const barraAltura = Math.round(tamanho * 0.055);
  const barraCurta = Math.round(tamanho * 0.26);
  const barraLonga = Math.round(tamanho * 0.44);
  const espaco = Math.round(tamanho * 0.055);

  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: espaco,
        background: "#101114",
      }}
    >
      <div
        style={{
          width: barraLonga,
          height: barraAltura,
          borderRadius: barraAltura,
          background: "#c97b3a",
        }}
      />
      <div
        style={{
          width: barraCurta,
          height: barraAltura,
          borderRadius: barraAltura,
          background: "#c97b3a",
        }}
      />
    </div>
  );
}
