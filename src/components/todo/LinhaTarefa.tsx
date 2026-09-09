"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUp, Calendar, CalendarClock, Check, Repeat } from "lucide-react";
import type { TarefaItem } from "@/lib/todo/dados";
import { alternarTarefaDia, puxarParaHoje } from "@/lib/todo/acoes";
import { vibrarMarcacao } from "@/lib/ui/sensorial";

const ICONE_TIPO = {
  recorrente: Repeat,
  semana: Calendar,
  data: CalendarClock,
} as const;

export default function LinhaTarefa({
  item,
  dataHoje,
  caminhoAtual,
  podePuxar = false,
}: {
  item: TarefaItem;
  dataHoje: string;
  caminhoAtual: string;
  /** Itens de "Esta semana" ganham o atalho de trazer para hoje. */
  podePuxar?: boolean;
}) {
  const { tarefa } = item;
  // Marcar precisa responder no toque; o servidor confirma logo atrás.
  const [feito, setFeito] = useState(item.feito);
  const IconeTipo = ICONE_TIPO[tarefa.tipo];

  function alternar() {
    const novo = !feito;
    setFeito(novo);
    vibrarMarcacao();
    alternarTarefaDia(caminhoAtual, tarefa.id, dataHoje, novo).catch(() =>
      setFeito(!novo),
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={alternar}
        aria-label={`${tarefa.texto} — ${feito ? "feito" : "não marcado"}`}
        className="flex min-h-11 shrink-0 items-center"
      >
        <span
          className={`flex h-[18px] w-[18px] items-center justify-center rounded-[3px] border transition-colors duration-[250ms] ${
            feito ? "border-acento bg-acento-escuro" : "border-filete-forte"
          }`}
        >
          {feito && (
            <Check className="entrada-check h-3 w-3 text-texto" strokeWidth={2} />
          )}
        </span>
      </button>

      <Link
        href={`/todo/${tarefa.id}`}
        className={`min-w-0 flex-1 truncate py-2 text-[15px] transition-colors duration-[250ms] ${
          feito ? "text-auxiliar line-through decoration-1" : "text-texto"
        }`}
      >
        {tarefa.texto}
      </Link>

      {podePuxar && !feito && (
        <button
          type="button"
          onClick={() => puxarParaHoje(caminhoAtual, tarefa.id, dataHoje)}
          aria-label="Trazer para hoje"
          className="-m-3 inline-flex shrink-0 p-3 text-auxiliar"
        >
          <ArrowUp className="h-[15px] w-[15px]" strokeWidth={1.5} />
        </button>
      )}

      <IconeTipo
        className="h-[13px] w-[13px] shrink-0 text-auxiliar-minimo"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </div>
  );
}
