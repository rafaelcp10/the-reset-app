import { Check, Minus } from "lucide-react";

/**
 * "Feito" com sinal, em vez de "feito" em texto corrido.
 *
 * Uma palavra cinza no meio de outras palavras cinzas não se vê: era o que
 * acontecia com o resultado do dia, que é justamente a única coisa daquela
 * linha que a pessoa foi lá conferir.
 *
 * O visto é âmbar. Verde seria mais óbvio e foi recusado de propósito — a
 * paleta tem quatro cores e não vale abrir uma quinta por um ícone.
 *
 * **Não feito não ganha sinal de erro.** Nem vermelho, nem X, nem risco:
 * um traço neutro e a palavra. "Não fiz" é registro válido, não falta, e é
 * a regra mais fácil de quebrar justamente aqui, no lugar onde toda outra
 * interface do mundo põe um vermelho.
 */
export default function MarcaFeito({
  feito,
  rotulo,
  texto,
}: {
  feito: boolean;
  /** O que vem depois, apagado: "ontem", "hoje". */
  rotulo?: string;
  /** Sobrescreve as palavras. Útil para concordância: "feita". */
  texto?: { sim: string; nao: string };
}) {
  const Icone = feito ? Check : Minus;
  const palavra = feito
    ? (texto?.sim ?? "Feito")
    : (texto?.nao ?? "Não feito");

  return (
    <span className="flex items-center gap-1.5">
      <Icone
        className={`h-[18px] w-[18px] shrink-0 ${
          feito ? "text-acento-claro" : "text-auxiliar-fraco"
        }`}
        strokeWidth={feito ? 2.5 : 2}
      />
      <span className="text-[16px] text-texto">{palavra}</span>
      {rotulo && (
        <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco">
          {rotulo}
        </span>
      )}
    </span>
  );
}
