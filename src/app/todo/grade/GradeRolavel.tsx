"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * A grade do mês abre no dia de hoje, não no dia 1.
 *
 * O começo do mês já passou — quem abre o histórico quer ver onde está,
 * e chegar até lá custava arrastar a tela para a direita toda vez. Voltar
 * continua sendo um arrasto para a esquerda, que é o gesto certo para
 * olhar o que ficou para trás.
 *
 * A rolagem é instantânea e acontece antes da pintura: animar até hoje
 * mostraria o mês inteiro correndo, que é exatamente o trabalho que este
 * ajuste veio tirar.
 */
export default function GradeRolavel({
  hoje,
  children,
}: {
  /** Data de hoje em ISO; vazia quando o mês exibido não é o corrente. */
  hoje: string | null;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const caixa = ref.current;
    if (!caixa) return;

    // Mês que não é o corrente começa no dia 1 — e precisa ser dito, não
    // deixado por omissão: navegando de setembro para agosto, o navegador
    // preserva a rolagem e agosto abriria no meio, sem motivo nenhum.
    if (!hoje) {
      caixa.scrollLeft = 0;
      return;
    }

    const alvo = caixa.querySelector<HTMLElement>(`[data-dia="${hoje}"]`);
    if (!alvo) {
      caixa.scrollLeft = 0;
      return;
    }

    // A coluna de nomes fica grudada à esquerda e cobriria o dia de hoje,
    // então o alvo para depois dela, com uma folga para não encostar.
    const fixa = caixa.querySelector<HTMLElement>(".coluna-fixa");
    const margem = (fixa?.offsetWidth ?? 0) + 8;

    const posAlvo = alvo.getBoundingClientRect().left;
    const posCaixa = caixa.getBoundingClientRect().left;
    caixa.scrollLeft += posAlvo - posCaixa - margem;
  }, [hoje]);

  return (
    <div ref={ref} className="overflow-x-auto pb-2">
      {children}
    </div>
  );
}
