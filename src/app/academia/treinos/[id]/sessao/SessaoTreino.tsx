"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, History } from "lucide-react";
import { apagarRegistro, registrarSerie } from "@/lib/academia/acoes";
import type { ItemSessao } from "@/lib/academia/sessao";
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

/** Formata sem casa decimal à toa: 60, e não 60,00. */
function kg(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  const numero = Number(valor);
  return `${numero % 1 === 0 ? numero : numero.toFixed(1).replace(".", ",")} kg`;
}

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

  const CAMPO =
    "w-full border-b border-filete-media bg-transparent py-1.5 text-center text-[17px] text-texto outline-none transition-colors duration-200 focus:border-acento focus:bg-acento-escuro";

  return (
    <div
      className={`flex flex-col gap-3 rounded-[14px] px-4 py-4 ${
        registrado ? "bloco-vez" : "bloco"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[18px] leading-[1.4] text-texto">{exercicio.nome}</p>
        <Link
          href={`/academia/exercicios/${exercicio.id}`}
          aria-label={`Histórico de ${exercicio.nome}`}
          className="-m-2 inline-flex shrink-0 p-2 text-auxiliar-fraco"
        >
          <History className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      </div>

      {/* A memória, em uma linha. É ela que transforma a tela num registro
          em vez de um formulário. */}
      <p className="text-[14.5px] leading-[1.6] text-auxiliar">
        {ultimo
          ? `última vez · ${ultimo.series ?? exercicio.series}×${ultimo.repeticoes ?? exercicio.repeticoes} · ${kg(ultimo.carga_kg)}`
          : "primeira vez — o que você fizer hoje vira a base."}
      </p>

      {ultimo && !registrado && (
        <p className="text-[14.5px] leading-[1.6] text-auxiliar-fraco">
          {semCarga
            ? `hoje a proposta é uma repetição a mais: ${propostaReps}`
            : `hoje a proposta é ${kg(propostaCarga)}`}
        </p>
      )}

      <div className="flex items-end gap-4">
        <label className="flex flex-1 flex-col gap-1">
          <span className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar-fraco">
            Séries
          </span>
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
          <span className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar-fraco">
            Reps
          </span>
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
          <span className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar-fraco">
            Carga (kg)
          </span>
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

      {registrado ? (
        <div className="flex items-center gap-4">
          <span className="tipo-rotulo flex items-center gap-2 text-[13.5px] tracking-[.16em] text-acento">
            <Check className="h-[19px] w-[19px]" strokeWidth={2} />
            Registrado
          </span>
          <button
            type="button"
            onClick={desfazer}
            className="text-[14.5px] text-auxiliar-fraco underline underline-offset-4"
          >
            desfazer
          </button>
          <button
            type="button"
            onClick={registrar}
            className="text-[14.5px] text-auxiliar underline underline-offset-4"
          >
            corrigir
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={registrar}
          disabled={salvando}
          className="pilula tipo-rotulo min-h-11 self-start rounded-[8px] px-6 text-center text-[13.5px] tracking-[.09em] text-texto disabled:opacity-50"
        >
          {salvando ? "Gravando" : "Registrar"}
        </button>
      )}
    </div>
  );
}
