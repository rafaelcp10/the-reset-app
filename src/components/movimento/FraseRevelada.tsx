import type { CSSProperties } from "react";

/**
 * A frase entra palavra por palavra, com escalonamento curto — precisa ler
 * como uma frase que aparece, não como um efeito. Reservado às duas telas
 * manifesto (abertura do onboarding e Home).
 *
 * A palavra escolhida pelo usuário entra por último e acesa: é o único
 * ponto quente da tela.
 */
export default function FraseRevelada({
  antes,
  destaque,
  depois,
  className = "",
  passo = 46,
  atrasoInicial = 100,
}: {
  antes: string;
  /** Palavra da lacuna. Quando vazia, entra o marcador apagado. */
  destaque?: string;
  depois?: string;
  className?: string;
  /** Intervalo entre palavras, em ms. */
  passo?: number;
  atrasoInicial?: number;
}) {
  const palavrasAntes = antes.split(/\s+/).filter(Boolean);
  const palavrasDepois = (depois ?? "").split(/\s+/).filter(Boolean);

  let indice = 0;
  const proximoAtraso = () => atrasoInicial + indice++ * passo;

  return (
    <p className={className}>
      {palavrasAntes.map((palavra, i) => (
        <span
          key={`a-${i}`}
          className="palavra-revelada"
          style={{ "--revelar-atraso": `${proximoAtraso()}ms` } as CSSProperties}
        >
          {palavra}&nbsp;
        </span>
      ))}

      {destaque !== undefined && (
        <span
          className="palavra-revelada"
          style={
            {
              "--revelar-atraso": `${proximoAtraso() + 160}ms`,
            } as CSSProperties
          }
        >
          <span className={destaque ? "palavra-escolhida" : "text-auxiliar-fraco"}>
            {destaque || "______"}
          </span>
        </span>
      )}

      {palavrasDepois.map((palavra, i) => (
        <span
          key={`d-${i}`}
          className="palavra-revelada"
          style={
            {
              "--revelar-atraso": `${proximoAtraso() + 200}ms`,
            } as CSSProperties
          }
        >
          {i === 0 ? "" : " "}
          {palavra}
        </span>
      ))}
    </p>
  );
}
