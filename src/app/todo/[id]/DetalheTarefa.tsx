"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { TarefaRow, TipoTarefa } from "@/lib/todo/dados";
import {
  excluirTarefa,
  salvarDataTarefa,
  salvarDiasSemana,
  salvarTextoTarefa,
  salvarTipoTarefa,
} from "@/lib/todo/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

const CAMINHO = "/todo";

const TIPOS: { valor: TipoTarefa; rotulo: string }[] = [
  { valor: "recorrente", rotulo: "Recorrente" },
  { valor: "semana", rotulo: "Da semana" },
  { valor: "data", rotulo: "Com data" },
];

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function DetalheTarefa({
  tarefa,
  dataHoje,
}: {
  tarefa: TarefaRow;
  dataHoje: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tipo, setTipo] = useState<TipoTarefa>(tarefa.tipo);
  const [dias, setDias] = useState<number[]>(tarefa.dias_semana ?? []);
  const [data, setData] = useState(tarefa.data ?? dataHoje);
  const [estadoSalvo, executar] = useEstadoSalvo();
  // O texto é o único campo que a pessoa digita; os outros salvam no toque.
  // Guardamos o último valor gravado para saber quando há algo pendente.
  const [ultimoSalvo, setUltimoSalvo] = useState(tarefa.texto);
  const [pendente, setPendente] = useState(false);

  function salvarTexto() {
    const texto = inputRef.current?.value.trim();
    setPendente(false);
    if (!texto || texto === ultimoSalvo) return;
    setUltimoSalvo(texto);
    const fd = new FormData();
    fd.set("texto", texto);
    executar(salvarTextoTarefa(CAMINHO, tarefa.id, fd));
  }

  function trocarTipo(novo: TipoTarefa) {
    setTipo(novo);
    executar(
      salvarTipoTarefa(CAMINHO, tarefa.id, novo, novo === "data" ? data : null),
    );
  }

  function alternarDia(dia: number) {
    const novos = dias.includes(dia)
      ? dias.filter((d) => d !== dia)
      : [...dias, dia].sort((a, b) => a - b);
    setDias(novos);
    executar(salvarDiasSemana(CAMINHO, tarefa.id, novos));
  }

  function trocarData(valor: string) {
    setData(valor);
    if (valor) executar(salvarDataTarefa(CAMINHO, tarefa.id, valor));
  }

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
            O item
          </h2>
          <IndicadorSalvo estado={estadoSalvo} />
        </div>
        <input
          ref={inputRef}
          type="text"
          defaultValue={tarefa.texto}
          onBlur={salvarTexto}
          onChange={(e) => setPendente(e.target.value.trim() !== ultimoSalvo)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inputRef.current?.blur();
            }
          }}
          enterKeyHint="done"
          className="w-full border-b border-filete-media bg-transparent py-2 text-[17px] leading-[1.6] text-texto outline-none transition-colors duration-200 focus:border-acento focus:bg-acento-escuro"
        />

        {/* Salvar só aparece quando há mudança pendente: enquanto não há o
            que gravar, ele seria um botão morto ocupando a tela. */}
        {pendente && (
          <button
            type="button"
            onClick={salvarTexto}
            className="pilula tipo-rotulo mt-2 self-start rounded-[8px] px-5 py-2.5 text-[12px] tracking-[.09em] text-texto"
          >
            Salvar
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
          Tipo
        </h2>
        <div className="flex gap-2">
          {TIPOS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => trocarTipo(opcao.valor)}
              className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3 text-center text-[12px] tracking-[.09em] text-texto ${
                tipo === opcao.valor ? "pilula-ativa" : ""
              }`}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </section>

      {tipo === "recorrente" && (
        <section className="flex flex-col gap-3">
          <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
            Em quais dias
          </h2>
          <div className="flex gap-1.5">
            {DIAS.map((rotulo, dia) => (
              <button
                key={rotulo}
                type="button"
                onClick={() => alternarDia(dia)}
                aria-pressed={dias.includes(dia)}
                className={`pilula tipo-rotulo min-h-11 flex-1 rounded-[8px] text-center text-[11px] tracking-[.06em] text-texto ${
                  dias.includes(dia) ? "pilula-ativa" : ""
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>
        </section>
      )}

      {tipo === "data" && (
        <section className="flex flex-col gap-3">
          <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
            Em que dia
          </h2>
          <input
            type="date"
            value={data}
            onChange={(e) => trocarData(e.target.value)}
            className="w-full border-b border-filete-media bg-transparent py-2 text-[16px] text-texto outline-none transition-colors duration-200 focus:border-acento focus:bg-acento-escuro"
          />
        </section>
      )}

      <form action={excluirTarefa.bind(null, tarefa.id)}>
        <button
          type="submit"
          className="flex items-center gap-2 text-[13px] text-auxiliar"
        >
          <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.5} />
          Excluir
        </button>
      </form>
    </div>
  );
}
