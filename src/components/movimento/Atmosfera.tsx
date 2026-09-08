import CamadaParallax from "./CamadaParallax";

/**
 * Os planos de fundo do app. Nenhuma imagem: é só luz e grão, então
 * funciona offline, escala em qualquer tela e não custa carregamento.
 * Fica atrás de tudo (z-0); o conteúdo sobe com a classe `.acima`.
 *
 * A bruma anda mais devagar que a página — é o que faz o fundo parecer
 * distante em vez de colado no texto.
 */
export default function Atmosfera() {
  return (
    <div className="atmosfera" aria-hidden="true">
      <div className="atmosfera-luz" />
      <CamadaParallax fator={0.09} maximo={80}>
        <div className="atmosfera-bruma atmosfera-bruma-a" />
        <div className="atmosfera-bruma atmosfera-bruma-b" />
      </CamadaParallax>
      <div className="atmosfera-vinheta" />
      <div className="atmosfera-grao" />
    </div>
  );
}
