"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, History } from "lucide-react";
import { apagarRegistro, registrarSerie } from "@/lib/saude/acoes";
import type { ItemSessao } from "@/lib/saude/sessao";
import {
  cargasDoRegistro,
  faixaDeCargas,
  kg as semZeroAtoa,
  resumoDeReps,
} from "@/lib/saude/serie";
import { vibrarMarcacao } from "@/lib/ui/sensorial";

export default function SessaoTreino({
  itens,
  treinoId,
  data,
}: {
  itens: ItemSessao[];
  treinoId: string;
  data: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {itens.map((item) => (
        <LinhaSessao
          key={item.exercicio.id}
          item={item}
          treinoId={treinoId}
          data={data}
        />
      ))}
    </div>
  );
}

/** Formata sem casa decimal à toa: 60 kg, e não 60,00 kg. */
function kg(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return `${semZeroAtoa(valor)} kg`;
}

const CAMPO =
  "w-full border-b border-filete-media bg-transparent py-1.5 text-center text-[17px] text-texto outline-none transition-colors duration-200 focus:border-acento focus:bg-acento-escuro";

const ROTULO =
  "tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco";

function LinhaSessao({
  item,
  treinoId,
  data,
}: {
  item: ItemSessao;
  treinoId: string;
  data: string;
}) {
  const { exercicio, ultimo, hoje, propostaCarga, propostaReps } = item;
  const semCarga = Number(exercicio.incremento_kg) === 0;

  // Os campos guardam texto para poderem ficar vazios enquanto se digita.
  const [carga, setCarga] = useState(
    String(hoje?.carga_kg ?? propostaCarga ?? ""),
  );
  const [reps, setReps] = useState(String(hoje?.repeticoes ?? propostaReps));
  const [series, setSeries] = useState(
    String(hoje?.series ?? exercicio.series),
  );

  // O modo lista: uma repetição e uma carga por série. Parte do que já foi
  // registrado hoje quando há, e da proposta quando não há.
  const [repsSerie, setRepsSerie] = useState<string[]>(() =>
    (hoje?.repeticoes_serie?.length
      ? hoje.repeticoes_serie
      : item.planoReps
    ).map(String),
  );
  // `String(c)`, e não o formatador pt-BR: `<input type="number">` recusa
  // vírgula decimal e apaga o próprio valor sem avisar — a proposta de
  // 42,5 kg chegava ao campo como campo vazio.
  const [cargasSerie, setCargasSerie] = useState<string[]>(() =>
    (hoje
      ? cargasDoRegistro(hoje, item.planoReps.length)
      : item.propostaCargas
    ).map((c) => (c === null ? "" : String(c))),
  );

  const [registrado, setRegistrado] = useState(Boolean(hoje));
  const [salvando, setSalvando] = useState(false);

  function numero(bruto: string, padrao: number) {
    const valor = Number(bruto.replace(",", "."));
    return Number.isFinite(valor) && bruto.trim() !== "" ? valor : padrao;
  }

  async function registrar() {
    if (salvando) return;
    setSalvando(true);
    vibrarMarcacao();
    setRegistrado(true);

    await registrarSerie(exercicio.id, treinoId, data, {
      carga: carga.trim() === "" ? null : numero(carga, 0),
      repeticoes: numero(reps, exercicio.repeticoes),
      series: numero(series, exercicio.series),
      repeticoesSerie: item.variavel
        ? repsSerie.map((r, i) => numero(r, item.planoReps[i] ?? 10))
        : null,
      cargasSerie: item.variavel
        ? cargasSerie.map((c) => (c.trim() === "" ? null : numero(c, 0)))
        : null,
    });

    setSalvando(false);
  }

  async function desfazer() {
    if (salvando) return;
    setSalvando(true);
    setRegistrado(false);
    await apagarRegistro(exercicio.id, treinoId, data);
    setSalvando(false);
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-[14px] px-4 py-4 ${
        registrado ? "bloco-vez" : "bloco"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[18px] leading-[1.4] text-texto">{exercicio.nome}</p>
        <Link
          href={`/saude/exercicios/${exercicio.id}`}
          aria-label={`Histórico de ${exercicio.nome}`}
          className="-m-2 inline-flex shrink-0 p-2 text-auxiliar-fraco"
        >
          <History className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      </div>

      {/* A memória, em uma linha. É ela que transforma a tela num registro
          em vez de um formulário. */}
      <p className="text-[15.5px] leading-[1.6] text-auxiliar">
        {ultimo ? `última vez · ${resumoDoUltimo(item)}` : "primeira vez — o que você fizer hoje vira a base."}
      </p>

      {ultimo && !registrado && (
        <p className="text-[15.5px] leading-[1.6] text-auxiliar-fraco">
          {item.variavel
            ? `hoje a proposta é ${faixaDeCargas(item.propostaCargas)}`
            : semCarga
              ? `hoje a proposta é uma repetição a mais: ${propostaReps}`
              : `hoje a proposta é ${kg(propostaCarga)}`}
        </p>
      )}

      {item.variavel ? (
        /* Uma linha por série. A carga não é uma só: numa pirâmide ela
           sobe a cada série que encurta, e um campo de carga só faria o
           registro guardar um número que não aconteceu em série nenhuma. */
        <div className="grid grid-cols-[28px_1fr_1.4fr] items-center gap-x-3 gap-y-1">
          <span aria-hidden />
          <span className={`${ROTULO} text-center`}>Reps</span>
          <span className={`${ROTULO} text-center`}>Carga (kg)</span>

          {repsSerie.map((valor, i) => (
            <Serie
              key={i}
              indice={i}
              nome={exercicio.nome}
              reps={valor}
              carga={cargasSerie[i] ?? ""}
              semCarga={semCarga}
              aoMudarReps={(v) =>
                setRepsSerie(repsSerie.map((r, j) => (j === i ? v : r)))
              }
              aoMudarCarga={(v) =>
                setCargasSerie(cargasSerie.map((c, j) => (j === i ? v : c)))
              }
            />
          ))}
        </div>
      ) : (
        <div className="flex items-end gap-4">
          <label className="flex flex-1 flex-col gap-1">
            <span className={ROTULO}>Séries</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={series}
              onChange={(e) => setSeries(e.target.value)}
              className={CAMPO}
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={ROTULO}>Reps</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className={CAMPO}
            />
          </label>
          <label className="flex flex-[1.4] flex-col gap-1">
            <span className={ROTULO}>Carga (kg)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              min={0}
              max={1000}
              value={carga}
              onChange={(e) => setCarga(e.target.value)}
              placeholder={semCarga ? "—" : ""}
              className={CAMPO}
            />
          </label>
        </div>
      )}

      {registrado ? (
        <div className="flex items-center gap-4">
          <span className="tipo-rotulo flex items-center gap-2 text-[14.5px] tracking-[.1em] text-acento-claro">
            <Check className="h-[19px] w-[19px]" strokeWidth={2} />
            Registrado
          </span>
          <button
            type="button"
            onClick={desfazer}
            className="text-[15.5px] text-auxiliar-fraco underline underline-offset-4"
          >
            desfazer
          </button>
          <button
            type="button"
            onClick={registrar}
            className="text-[15.5px] text-auxiliar underline underline-offset-4"
          >
            corrigir
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={registrar}
          disabled={salvando}
          className="pilula tipo-rotulo min-h-11 self-start rounded-[8px] px-6 text-center text-[14.5px] tracking-[.09em] text-texto disabled:opacity-50"
        >
          {salvando ? "Gravando" : "Registrar"}
        </button>
      )}
    </div>
  );
}

/** Uma série do modo lista: a ordem, as repetições e a carga daquela série. */
function Serie({
  indice,
  nome,
  reps,
  carga,
  semCarga,
  aoMudarReps,
  aoMudarCarga,
}: {
  indice: number;
  nome: string;
  reps: string;
  carga: string;
  semCarga: boolean;
  aoMudarReps: (valor: string) => void;
  aoMudarCarga: (valor: string) => void;
}) {
  return (
    <>
      <span className="text-[15px] tabular-nums text-auxiliar-fraco">
        {indice + 1}ª
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={100}
        value={reps}
        aria-label={`Repetições da ${indice + 1}ª série de ${nome}`}
        onChange={(e) => aoMudarReps(e.target.value)}
        className={CAMPO}
      />
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min={0}
        max={1000}
        value={carga}
        aria-label={`Carga da ${indice + 1}ª série de ${nome}`}
        onChange={(e) => aoMudarCarga(e.target.value)}
        placeholder={semCarga ? "—" : ""}
        className={CAMPO}
      />
    </>
  );
}

/**
 * "12 · 10 · 8 · 6 · 40 a 55 kg", ou "3×10 · 60 kg".
 *
 * A carga do variável sai em faixa, e não em lista: quatro cargas em linha
 * não cabem ao lado das quatro repetições, e de relance o que se quer
 * saber é onde começou e onde terminou.
 */
function resumoDoUltimo(item: ItemSessao): string {
  const { ultimo, exercicio } = item;
  if (!ultimo) return "";

  if (ultimo.repeticoes_serie?.length) {
    const cargas = cargasDoRegistro(ultimo, ultimo.repeticoes_serie.length);
    return `${resumoDeReps(ultimo.repeticoes_serie.map(Number))} · ${faixaDeCargas(cargas)}`;
  }

  // Registro antigo, de antes de este exercício virar lista — ou exercício
  // que nunca foi lista. Nos dois casos é o resumo de sempre.
  const series = ultimo.series ?? exercicio.series;
  const reps = ultimo.repeticoes ?? exercicio.repeticoes;
  return `${series}×${reps} · ${kg(ultimo.carga_kg)}`;
}
