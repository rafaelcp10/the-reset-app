"use client";

import { useRef, useState } from "react";
import { concluirEspelho, concluirEspelhoComLinha } from "@/lib/ritual/acoes";

/**
 * O último passo do Espelho. A pessoa acabou de ler quem escolheu ser; o
 * que falta é decidir o que vai fazer com isso hoje.
 *
 * Em vez de largar um campo em branco — que é fadiga de decisão no pior
 * momento — mostramos o dia que já existe e pedimos só a escolha. Escrever
 * do zero continua possível, mas como último recurso, não como primeiro.
 */
export default function EscolhaDoDia({
  tarefas,
  ditoOntem,
  dataHoje,
}: {
  tarefas: string[];
  /** O que a pessoa deixou dito na noite anterior. */
  ditoOntem: string | null;
  dataHoje: string;
}) {
  // Backlog vazio é o estado normal de quem começou hoje, não uma exceção.
  // Nesse caso a tela já abre escrevendo: mostrar uma lista vazia e pedir
  // que a pessoa procure o "escrever outra" é fazê-la caçar a única saída.
  const vazio = !ditoOntem && tarefas.length === 0;
  const [escrevendo, setEscrevendo] = useState(vazio);
  const [enviando, setEnviando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function escolher(texto: string) {
    if (enviando || !texto.trim()) return;
    setEnviando(true);
    concluirEspelhoComLinha(dataHoje, texto.trim());
  }

  function adiar() {
    if (enviando) return;
    setEnviando(true);
    concluirEspelho(dataHoje);
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="entrada-frase flex flex-1 flex-col gap-8 px-6 py-8"
    >
      <div className="flex flex-col gap-2">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar">
          A linha de hoje
        </span>
        <h1 className="text-[26px] leading-[1.3] text-texto">
          Qual é a de hoje?
        </h1>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          {vazio
            ? "Ainda não há nada no seu dia. Escreva a de hoje."
            : "Do que já está no seu dia. Uma só."}
        </p>
      </div>

      {escrevendo ? (
        <div className="flex flex-col gap-4">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            enterKeyHint="done"
            placeholder="o que eu vou fazer hoje"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                escolher(inputRef.current?.value ?? "");
              }
            }}
            className="w-full border-b border-filete-media bg-transparent py-2 text-[19px] leading-[1.6] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
          />
          <button
            type="button"
            disabled={enviando}
            onClick={() => escolher(inputRef.current?.value ?? "")}
            className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
          >
            É essa
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={vazio ? adiar : () => setEscrevendo(false)}
            className="self-start text-[13.5px] text-auxiliar-fraco"
          >
            {vazio ? "decidir depois" : "voltar para a lista"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {/* O que ficou dito ontem vem primeiro e separado: não é uma
                tarefa qualquer, é a pessoa se respondendo. */}
            {ditoOntem && (
              <div className="mb-4 flex flex-col gap-1">
                <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar-fraco">
                  Você disse ontem
                </span>
                <button
                  type="button"
                  disabled={enviando}
                  onClick={() => escolher(ditoOntem)}
                  className="flex min-h-14 items-center text-left text-[19px] leading-[1.5] text-acento transition-opacity duration-200 disabled:opacity-40"
                >
                  {ditoOntem}
                </button>
                <div className="fio-luz mt-2" />
              </div>
            )}

            {tarefas.map((tarefa) => (
              <button
                key={tarefa}
                type="button"
                disabled={enviando}
                onClick={() => escolher(tarefa)}
                className="flex min-h-14 items-center text-left text-[18px] leading-[1.5] text-texto transition-opacity duration-200 disabled:opacity-40"
              >
                {tarefa}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setEscrevendo(true)}
              className="self-start text-[13.5px] text-auxiliar underline underline-offset-4"
            >
              escrever outra
            </button>
            <button
              type="button"
              disabled={enviando}
              onClick={adiar}
              className="self-start text-[13.5px] text-auxiliar-fraco"
            >
              decidir depois
            </button>
          </div>
        </>
      )}
    </div>
  );
}
