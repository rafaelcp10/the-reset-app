"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { salvarLembreteAtivo, salvarHorarioAjustes } from "@/lib/ajustes/acoes";
import { salvarPreferenciasRitual } from "@/lib/ritual/acoes";
import { ativarPush, desativarPush } from "@/lib/push/cliente";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";
import Revelar from "@/components/movimento/Revelar";

const OPCOES_HORARIO = ["20:30", "21:00", "21:30", "22:00", "22:30"] as const;
const OPCOES_REPETICOES = [1, 3, 5] as const;

export default function AjustesForm({
  horarioInicial,
  lembreteInicial,
  repsInicial,
  maosLivresInicial,
  chaveVapid,
  guardarAcesso,
}: {
  horarioInicial: string;
  lembreteInicial: boolean;
  repsInicial: number;
  maosLivresInicial: boolean;
  chaveVapid: string;
  /** Bloco de recuperação de conta, montado no servidor. */
  guardarAcesso: ReactNode;
}) {
  const [horario, setHorario] = useState(horarioInicial);
  const [lembrete, setLembrete] = useState(lembreteInicial);
  const [reps, setReps] = useState(repsInicial);
  const [maosLivres, setMaosLivres] = useState(maosLivresInicial);
  const [estadoSalvo, executar] = useEstadoSalvo();
  const [avisoPush, setAvisoPush] = useState<string | null>(null);

  function alterarHorario(valor: string) {
    setHorario(valor);
    executar(salvarHorarioAjustes(valor));
  }

  async function alternarLembrete() {
    const novo = !lembrete;
    setLembrete(novo);
    setAvisoPush(null);

    // Ligar o lembrete é pedir permissão de notificação e inscrever o
    // aparelho: sem isso a preferência não faria nada.
    if (novo) {
      const resultado = await ativarPush(chaveVapid);
      if (resultado !== "ativado") {
        setLembrete(false);
        setAvisoPush(
          resultado === "negado"
            ? "O navegador bloqueou as notificações. Libere nos ajustes do aparelho."
            : "Este aparelho não recebe notificações. No iPhone, é preciso instalar o app na tela de início.",
        );
        return;
      }
    } else {
      await desativarPush();
    }

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
    <div className="flex grow flex-col gap-10 px-6 pb-10 pt-6">
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

      <Revelar imediato atraso={60}>
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
                  lembrete
                    ? "translate-x-[18px] bg-texto"
                    : "translate-x-0 bg-auxiliar-fraco"
                }`}
              />
            </button>
          </div>

          {avisoPush && (
            <p className="text-[12.5px] leading-[1.5] text-erro">{avisoPush}</p>
          )}

          <div className="flex gap-2">
            {OPCOES_HORARIO.map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => alterarHorario(opcao)}
                className={`pilula tipo-rotulo flex-1 rounded-[8px] py-2.5 text-center text-[13px] tracking-[.09em] text-texto ${
                  horario === opcao ? "pilula-ativa" : ""
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
        </section>
      </Revelar>

      <Revelar imediato atraso={140}>
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
                className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3.5 text-center text-[16px] tracking-[.09em] text-texto ${
                  reps === valor ? "pilula-ativa" : ""
                }`}
              >
                {valor}
              </button>
            ))}
          </div>
        </section>
      </Revelar>

      <Revelar imediato atraso={220}>
        <section className="flex flex-col gap-3">
          <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
            Como as frases avançam
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => alterarAvanco(false)}
              className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3.5 text-center text-[13px] tracking-[.09em] text-texto ${
                !maosLivres ? "pilula-ativa" : ""
              }`}
            >
              Por toque
            </button>
            <button
              type="button"
              onClick={() => alterarAvanco(true)}
              className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3.5 text-center text-[13px] tracking-[.09em] text-texto ${
                maosLivres ? "pilula-ativa" : ""
              }`}
            >
              Automático
            </button>
          </div>
        </section>
      </Revelar>

      <Revelar imediato atraso={300}>{guardarAcesso}</Revelar>

      <Revelar imediato atraso={360}>
        <section className="flex flex-col gap-3 text-[15px]">
          <Link
            href="/ritual/domingo"
            className="text-auxiliar underline underline-offset-4"
          >
            Revisão de domingo
          </Link>
          <Link
            href="/recomeco"
            className="text-auxiliar underline underline-offset-4"
          >
            Tela de recomeço
          </Link>
        </section>
      </Revelar>
    </div>
  );
}
