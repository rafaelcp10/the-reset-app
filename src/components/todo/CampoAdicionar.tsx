"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { criarTarefa } from "@/lib/todo/acoes";
import { PERIODOS, ROTULO_PERIODO, type PeriodoTarefa } from "@/lib/todo/dados";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

type Quando = PeriodoTarefa | "recorrente";

/**
 * Escreve e pronto — só que agora dizendo quando.
 *
 * Os quatro botões aparecem só depois que há texto: antes disso seriam
 * quatro escolhas para uma tarefa que ainda não existe. Nenhum é
 * obrigatório; sem escolha a tarefa nasce sem hora e espera em "A qualquer
 * hora", que é um lugar legítimo e não um esquecimento.
 */
export default function CampoAdicionar({
  caminhoAtual,
}: {
  caminhoAtual: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [temTexto, setTemTexto] = useState(false);
  const [quando, setQuando] = useState<Quando | null>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar() {
    const texto = inputRef.current?.value.trim();
    if (!texto) return;
    const fd = new FormData();
    fd.set("texto", texto);
    if (quando) fd.set("quando", quando);
    if (inputRef.current) inputRef.current.value = "";
    setTemTexto(false);
    setQuando(null);
    executar(criarTarefa(caminhoAtual, fd));
  }

  const opcoes: { valor: Quando; rotulo: string }[] = [
    ...PERIODOS.map((p) => ({ valor: p as Quando, rotulo: ROTULO_PERIODO[p] })),
    { valor: "recorrente", rotulo: "Recorrente" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="bloco flex items-center gap-3 px-4">
        <input
          ref={inputRef}
          type="text"
          onChange={(e) => setTemTexto(e.target.value.trim().length > 0)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              salvar();
            }
          }}
          enterKeyHint="done"
          placeholder="adicionar"
          className="w-full bg-transparent py-4 text-[15px] text-texto outline-none placeholder:text-auxiliar-fraco"
        />
        {temTexto && (
          <button
            type="button"
            onClick={salvar}
            aria-label="Adicionar"
            className="-m-2 inline-flex shrink-0 p-2 text-texto"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {temTexto && (
        <div className="flex flex-wrap gap-2">
          {opcoes.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() =>
                setQuando(quando === opcao.valor ? null : opcao.valor)
              }
              className={`pilula tipo-rotulo min-h-11 flex-1 rounded-[10px] px-3 text-center text-[11px] tracking-[.06em] text-texto ${
                quando === opcao.valor ? "pilula-ativa" : ""
              }`}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      )}

      <IndicadorSalvo estado={estadoSalvo} />
    </div>
  );
}
