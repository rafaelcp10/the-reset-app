"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { salvarLembreteAtivo, salvarHorarioAjustes } from "@/lib/ajustes/acoes";
import { salvarPreferenciasRitual } from "@/lib/ritual/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";

const OPCOES_HORARIO = ["20:30", "21:00", "21:30", "22:00", "22:30"] as const;
const OPCOES_REPETICOES = [1, 3, 5] as const;

export default function AjustesForm({
  horarioInicial,
  lembreteInicial,
  repsInicial,
  maosLivresInicial,
}: {
  horarioInicial: string;
  lembreteInicial: boolean;
  repsInicial: number;
  maosLivresInicial: boolean;
}) {
  const [horario, setHorario] = useState(horarioInicial);
  const [lembrete, setLembrete] = useState(lembreteInicial);
  const [reps, setReps] = useState(repsInicial);
  const [maosLivres, setMaosLivres] = useState(maosLivresInicial);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function alterarHorario(valor: string) {
    setHorario(valor);
    executar(salvarHorarioAjustes(valor));
  }

  function alternarLembrete() {
    const novo = !lembrete;
    setLembrete(novo);
    executar(salvarLembreteAtivo(novo));
  }

  function alterarReps(valor: number) {
    setReps(valor);
    executar(salvarPreferenciasRitual(valor, maosLivres));
  }

  function alterarAvanco(automatico: boolean) {
    setMaosLivres(automatico);
    executar(salvarPreferenciasRitual(reps, automatico));
  }

  return (
    <div className="flex flex-col gap-10 px-6 pb-10 pt-6">
      <div className="flex items-center gap-4">
        <Link
          href="/ritual"
          aria-label="Voltar"
          className="-m-3 inline-flex p-3 text-auxiliar"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <h1 className="text-[21px] text-texto">Ajustes</h1>
        <IndicadorSalvo estado={estadoSalvo} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[16px] text-texto">Check-in noturno</p>
            <p className="text-[13px] text-auxiliar">Aviso às {horario}</p>
          </div>
          <button
            type="button"
            onClick={alternarLembrete}
            aria-label="Alternar lembrete noturno"
            className={`h-[26px] w-[44px] shrink-0 rounded-full p-[3px] transition-colors ${
              lembrete ? "bg-superficie3" : "bg-superficie2"
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full transition-transform ${
                lembrete ? "translate-x-[18px] bg-texto" : "translate-x-0 bg-auxiliar-fraco"
              }`}
            />
          </button>
        </div>

        <div className="flex gap-2">
          {OPCOES_HORARIO.map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => alterarHorario(opcao)}
              className={`tipo-rotulo flex-1 rounded-[6px] py-2 text-center text-[13px] tracking-[.09em] ${
                horario === opcao
                  ? "bg-superficie3 text-texto"
                  : "bg-superficie2 text-texto"
              }`}
            >
              {opcao}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Repetições por frase
        </h2>
        <div className="flex gap-2">
          {OPCOES_REPETICOES.map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => alterarReps(valor)}
              className={`tipo-rotulo flex-1 rounded-[6px] py-3 text-center text-[16px] tracking-[.09em] ${
                reps === valor
                  ? "bg-superficie3 text-texto"
                  : "bg-superficie2 text-texto"
              }`}
            >
              {valor}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Como as frases avançam
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => alterarAvanco(false)}
            className={`tipo-rotulo flex-1 rounded-[6px] py-3 text-center text-[13px] tracking-[.09em] ${
              !maosLivres ? "bg-superficie3 text-texto" : "bg-superficie2 text-texto"
            }`}
          >
            Por toque
          </button>
          <button
            type="button"
            onClick={() => alterarAvanco(true)}
            className={`tipo-rotulo flex-1 rounded-[6px] py-3 text-center text-[13px] tracking-[.09em] ${
              maosLivres ? "bg-superficie3 text-texto" : "bg-superficie2 text-texto"
            }`}
          >
            Automático
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 text-[15px]">
        <Link href="/ritual/domingo" className="text-auxiliar underline underline-offset-4">
          Revisão de domingo
        </Link>
        <Link href="/recomeco" className="text-auxiliar underline underline-offset-4">
          Tela de recomeço
        </Link>
      </section>
    </div>
  );
}
