"use client";

import { useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  adicionarExercicio,
  excluirExercicio,
  excluirTreino,
  salvarDiasTreino,
  salvarExercicio,
  salvarNomeTreino,
} from "@/lib/academia/acoes";
import { ROTULO_GRUPO, sugerir, type ExercicioCatalogo } from "@/lib/academia/catalogo";
import type { ExercicioRow, TreinoRow } from "@/lib/academia/dados";
import { DIAS_ABREV } from "@/lib/academia/semana";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

export default function DetalheTreino({
  treino,
  exercicios,
}: {
  treino: TreinoRow;
  exercicios: ExercicioRow[];
}) {
  const nomeRef = useRef<HTMLInputElement>(null);
  const [dias, setDias] = useState<number[]>(treino.dias_semana ?? []);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvarNome() {
    const nome = nomeRef.current?.value.trim();
    if (!nome || nome === treino.nome) return;
    const fd = new FormData();
    fd.set("nome", nome);
    executar(salvarNomeTreino(treino.id, fd));
  }

  function alternarDia(dia: number) {
    const novos = dias.includes(dia)
      ? dias.filter((d) => d !== dia)
      : [...dias, dia].sort((a, b) => a - b);
    setDias(novos);
    executar(salvarDiasTreino(treino.id, novos));
  }

  return (
    <div className="flex grow flex-col gap-10 px-6 pb-10 pt-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
            O treino
          </h2>
          <IndicadorSalvo estado={estadoSalvo} />
        </div>
        <input
          ref={nomeRef}
          type="text"
          defaultValue={treino.nome}
          onBlur={salvarNome}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              nomeRef.current?.blur();
            }
          }}
          enterKeyHint="done"
          className="w-full border-b border-filete-media bg-transparent py-2 text-[19px] leading-[1.5] text-texto outline-none transition-colors duration-200 focus:border-acento focus:bg-acento-escuro"
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
          Em quais dias
        </h2>
        {dias.length === 0 && (
          <p className="text-[13px] leading-[1.6] text-auxiliar">
            Sem dia marcado ele não aparece em Hoje — fica guardado aqui até
            você escolher.
          </p>
        )}
        <div className="flex gap-1.5">
          {DIAS_ABREV.map((rotulo, dia) => (
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

      <section className="flex flex-col gap-4">
        <h2 className="tipo-rotulo text-[11px] tracking-[.18em] text-auxiliar">
          Exercícios
        </h2>

        {exercicios.length === 0 ? (
          <p className="text-[15px] leading-[1.6] text-auxiliar">
            Nenhum ainda. Escreva o nome abaixo — o app completa se conhecer, e
            aceita qualquer nome que você der.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {exercicios.map((exercicio) => (
              <LinhaExercicio
                key={exercicio.id}
                exercicio={exercicio}
                treinoId={treino.id}
                aoExecutar={executar}
              />
            ))}
          </div>
        )}

        <CampoExercicio treinoId={treino.id} aoExecutar={executar} />
      </section>

      <form action={excluirTreino.bind(null, treino.id)}>
        <button
          type="submit"
          className="flex items-center gap-2 text-[13px] text-auxiliar"
        >
          <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.5} />
          Excluir treino
        </button>
      </form>
    </div>
  );
}

/**
 * Séries, repetições e degrau de um exercício.
 *
 * O degrau é o passo de carga: o quanto o app vai propor a mais na próxima
 * vez. Zero quer dizer que ali quem sobe é a repetição, não o peso — é o
 * caso de barra fixa e flexão.
 */
function LinhaExercicio({
  exercicio,
  treinoId,
  aoExecutar,
}: {
  exercicio: ExercicioRow;
  treinoId: string;
  aoExecutar: (p: Promise<unknown>) => void;
}) {
  // Os campos guardam texto, não número.
  //
  // Com número, apagar o conteúdo virava `Number("")`, que é zero — o campo
  // se reescrevia sozinho com "0" e não dava mais para digitar 12 sem antes
  // vencer um zero que voltava a cada tecla. Agora o vazio continua vazio
  // enquanto se digita, e só ao sair do campo vira número.
  const [series, setSeries] = useState(String(exercicio.series));
  const [reps, setReps] = useState(String(exercicio.repeticoes));
  const [degrau, setDegrau] = useState(String(Number(exercicio.incremento_kg)));

  function numeroOu(bruto: string, padrao: number) {
    const valor = Number(bruto.replace(",", "."));
    return Number.isFinite(valor) && bruto.trim() !== "" ? valor : padrao;
  }

  function salvar() {
    const novo = {
      series: numeroOu(series, exercicio.series),
      repeticoes: numeroOu(reps, exercicio.repeticoes),
      incremento_kg: numeroOu(degrau, Number(exercicio.incremento_kg)),
    };
    // Devolve à tela o que foi mesmo gravado, já corrigido pelos limites.
    setSeries(String(novo.series));
    setReps(String(novo.repeticoes));
    setDegrau(String(novo.incremento_kg));
    aoExecutar(salvarExercicio(exercicio.id, treinoId, novo));
  }

  const CAMPO =
    "w-full border-b border-filete-media bg-transparent py-1.5 text-center text-[16px] text-texto outline-none transition-colors duration-200 focus:border-acento focus:bg-acento-escuro";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[17px] leading-[1.4] text-texto">{exercicio.nome}</p>
        <form action={excluirExercicio.bind(null, exercicio.id, treinoId)}>
          <button
            type="submit"
            aria-label={`Remover ${exercicio.nome}`}
            className="-m-2 inline-flex shrink-0 p-2 text-auxiliar-fraco"
          >
            <Trash2 className="h-[14px] w-[14px]" strokeWidth={1.5} />
          </button>
        </form>
      </div>

      {exercicio.grupo && (
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar-fraco">
          {ROTULO_GRUPO[exercicio.grupo]}
        </span>
      )}

      <div className="flex items-end gap-4">
        <label className="flex flex-1 flex-col gap-1">
          <span className="tipo-rotulo text-[9px] tracking-[.18em] text-auxiliar-fraco">
            Séries
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            onBlur={salvar}
            className={CAMPO}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="tipo-rotulo text-[9px] tracking-[.18em] text-auxiliar-fraco">
            Reps
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={salvar}
            className={CAMPO}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="tipo-rotulo text-[9px] tracking-[.18em] text-auxiliar-fraco">
            Degrau
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            min={0}
            max={50}
            value={degrau}
            onChange={(e) => setDegrau(e.target.value)}
            onBlur={salvar}
            className={CAMPO}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * O campo que adiciona exercício, com o catálogo completando.
 *
 * As sugestões só aparecem depois de dois caracteres, e nunca sozinhas: se
 * a lista se abrisse antes de a pessoa escrever, viraria menu de opções — e
 * aí o app estaria sugerindo treino, que é exatamente o que ele não faz.
 */
function CampoExercicio({
  treinoId,
  aoExecutar,
}: {
  treinoId: string;
  aoExecutar: (p: Promise<unknown>) => void;
}) {
  const [texto, setTexto] = useState("");
  const sugestoes = sugerir(texto);

  function adicionar(item?: ExercicioCatalogo) {
    const nome = (item?.nome ?? texto).trim();
    if (!nome) return;
    const fd = new FormData();
    fd.set("nome", nome);
    if (item) {
      fd.set("grupo", item.grupo);
      fd.set("degrau", String(item.degrau));
    }
    setTexto("");
    aoExecutar(adicionarExercicio(treinoId, fd));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 border-b border-filete-media transition-colors duration-200 focus-within:border-acento focus-within:bg-acento-escuro">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar(sugestoes[0]);
            }
          }}
          enterKeyHint="done"
          placeholder="adicionar exercício"
          className="w-full bg-transparent py-3 text-[15px] text-texto outline-none placeholder:text-auxiliar-fraco"
        />
        {texto.trim() && (
          <button
            type="button"
            onClick={() => adicionar()}
            aria-label="Adicionar exercício"
            className="-m-2 inline-flex shrink-0 p-2 text-texto"
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
        )}
      </div>

      {sugestoes.length > 0 && (
        <div className="flex flex-col pt-1">
          {sugestoes.map((item) => (
            <button
              key={item.nome}
              type="button"
              onClick={() => adicionar(item)}
              className="flex min-h-11 items-center justify-between gap-3 text-left"
            >
              <span className="text-[15px] text-texto">{item.nome}</span>
              <span className="tipo-rotulo shrink-0 text-[9px] tracking-[.2em] text-auxiliar-fraco">
                {ROTULO_GRUPO[item.grupo]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
