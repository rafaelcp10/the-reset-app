"use client";

import { useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  salvarAjusteNutricao,
  salvarBiotipo,
  salvarObjetivo,
} from "@/lib/saude/acoes";
import {
  BIOTIPOS,
  DESCRICAO_BIOTIPO,
  DESCRICAO_OBJETIVO,
  OBJETIVOS,
  ROTULO_BIOTIPO,
  ROTULO_OBJETIVO,
  type Biotipo,
  type Objetivo,
} from "@/lib/saude/nutricao";
import Painel from "@/components/saude/Painel";

type Campo = {
  id: string;
  rotulo: string;
  unidade: string;
  passo: string;
  nota?: string;
};

const CAMPOS: Campo[] = [
  {
    id: "garrafa_ml",
    rotulo: "Sua garrafa",
    unidade: "ml",
    passo: "50",
    nota: "É ela que vira o número de garrafas do dia.",
  },
  {
    id: "treino_minutos",
    rotulo: "Treino",
    unidade: "min",
    passo: "5",
    nota: "Quanto dura um treino seu. Vale quando não houve cronômetro.",
  },
  {
    id: "corrida_km",
    rotulo: "Corrida",
    unidade: "km",
    passo: "0.1",
    nota: "Quanto você costuma correr. Zero tira a corrida da conta.",
  },
  {
    id: "proteina_g_kg",
    rotulo: "Proteína",
    unidade: "g/kg",
    passo: "0.1",
    nota: "Por quilo de massa magra.",
  },
  {
    id: "gordura_g_kg",
    rotulo: "Gordura",
    unidade: "g/kg",
    passo: "0.05",
    nota: "Por quilo de peso total.",
  },
];

/**
 * O que a conta precisa e o app não tinha como saber.
 *
 * Fica no fim da tela de propósito: mexe-se aqui uma vez e não se volta.
 * A ordem é por quanto cada coisa mexe no resultado — objetivo primeiro
 * (50% entre perder e ganhar), biotipo em seguida (até 40%), e depois os
 * quatro números que só afinam uma conta que já existe.
 */
export default function AjustesNutricao({
  objetivo,
  biotipo,
  garrafaMl,
  corridaKm,
  treinoMinutos,
  proteinaGKg,
  gorduraGKg,
}: {
  objetivo: Objetivo;
  biotipo: Biotipo | null;
  garrafaMl: number | null;
  corridaKm: number;
  treinoMinutos: number;
  proteinaGKg: number;
  gorduraGKg: number;
}) {
  const iniciais: Record<string, string> = {
    garrafa_ml: garrafaMl !== null ? String(garrafaMl) : "",
    corrida_km: corridaKm > 0 ? String(corridaKm) : "",
    treino_minutos: String(treinoMinutos),
    proteina_g_kg: String(proteinaGKg),
    gordura_g_kg: String(gorduraGKg),
  };

  return (
    <Painel icone={SlidersHorizontal} rotulo="A sua conta">
      {/* O objetivo vem primeiro porque é o que mais mexe no número:
          perder corta 20%, ganhar soma 20%. Ele morava só no perfil, longe
          de onde o resultado aparece, e era impossível perceber que estava
          no valor errado. */}
      <Escolha
        rotulo="Objetivo"
        opcoes={OBJETIVOS}
        atual={objetivo}
        nome={(o) => ROTULO_OBJETIVO[o]}
        descricao={(o) => DESCRICAO_OBJETIVO[o]}
        aoEscolher={salvarObjetivo}
      />

      <div className="border-t border-filete pt-4">
        <Escolha
          rotulo="Biotipo"
          opcoes={BIOTIPOS}
          atual={biotipo}
          nome={(b) => ROTULO_BIOTIPO[b]}
          descricao={(b) => DESCRICAO_BIOTIPO[b]}
          aoEscolher={salvarBiotipo}
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-filete pt-4">
        {CAMPOS.map((campo) => (
          <Numero key={campo.id} campo={campo} inicial={iniciais[campo.id]} />
        ))}
      </div>
    </Painel>
  );
}

/**
 * Uma escolha entre poucas opções, cada uma com a própria explicação.
 *
 * Serve ao objetivo e ao biotipo, que são as duas perguntas que mais
 * mexem no número e as duas que o app não tem como adivinhar. A descrição
 * de cada opção é o que se enxerga na vida, sem uma palavra de fisiologia.
 */
function Escolha<T extends string>({
  rotulo,
  opcoes,
  atual,
  nome,
  descricao,
  aoEscolher,
}: {
  rotulo: string;
  opcoes: readonly T[];
  atual: T | null;
  nome: (valor: T) => string;
  descricao: (valor: T) => string;
  aoEscolher: (valor: string) => Promise<void>;
}) {
  const [enviando, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <span className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar-fraco">
        {rotulo}
      </span>
      <div className="flex flex-col gap-1.5">
        {opcoes.map((valor) => (
          <button
            key={valor}
            type="button"
            disabled={enviando}
            aria-pressed={atual === valor}
            onClick={() => iniciar(() => void aoEscolher(valor))}
            className={`flex min-h-11 flex-col gap-0.5 rounded-[10px] px-3.5 py-2.5 text-left transition-colors duration-200 disabled:opacity-60 ${
              atual === valor ? "bg-superficie3" : "bg-superficie3/40"
            }`}
          >
            <span
              className={`text-[16px] ${
                atual === valor ? "text-texto" : "text-auxiliar"
              }`}
            >
              {nome(valor)}
            </span>
            <span className="text-[13.5px] leading-[1.4] text-auxiliar-fraco">
              {descricao(valor)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Numero({ campo, inicial }: { campo: Campo; inicial: string }) {
  const [valor, setValor] = useState(inicial);
  const [, iniciar] = useTransition();

  return (
    <label className="flex flex-col gap-1">
      <span className="flex items-center justify-between gap-4">
        <span className="text-[16px] text-texto">{campo.rotulo}</span>
        <span className="flex shrink-0 items-baseline gap-2">
          <input
            type="number"
            inputMode="decimal"
            step={campo.passo}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() =>
              iniciar(() => void salvarAjusteNutricao(campo.id, valor))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            enterKeyHint="done"
            placeholder="—"
            className="w-[86px] border-b border-filete-media bg-transparent py-1.5 text-right text-[19px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
          />
          <span className="w-10 text-[14px] text-auxiliar">
            {campo.unidade}
          </span>
        </span>
      </span>
      {campo.nota && (
        <span className="text-[13.5px] leading-[1.4] text-auxiliar-fraco">
          {campo.nota}
        </span>
      )}
    </label>
  );
}
