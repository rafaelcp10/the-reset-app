"use client";

import { useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { salvarAjusteNutricao, salvarBiotipo } from "@/lib/saude/acoes";
import {
  BIOTIPOS,
  DESCRICAO_BIOTIPO,
  ROTULO_BIOTIPO,
  type Biotipo,
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
 * O biotipo vem primeiro porque sem ele não há conta nenhuma — os outros
 * quatro só afinam uma conta que já existe.
 */
export default function AjustesNutricao({
  biotipo,
  garrafaMl,
  corridaKm,
  proteinaGKg,
  gorduraGKg,
}: {
  biotipo: Biotipo | null;
  garrafaMl: number | null;
  corridaKm: number;
  proteinaGKg: number;
  gorduraGKg: number;
}) {
  const iniciais: Record<string, string> = {
    garrafa_ml: garrafaMl !== null ? String(garrafaMl) : "",
    corrida_km: corridaKm > 0 ? String(corridaKm) : "",
    proteina_g_kg: String(proteinaGKg),
    gordura_g_kg: String(gorduraGKg),
  };

  return (
    <Painel icone={SlidersHorizontal} rotulo="A sua conta">
      <EscolhaBiotipo atual={biotipo} />

      <div className="flex flex-col gap-4 border-t border-filete pt-4">
        {CAMPOS.map((campo) => (
          <Numero key={campo.id} campo={campo} inicial={iniciais[campo.id]} />
        ))}
      </div>
    </Painel>
  );
}

/**
 * O biotipo multiplica o metabolismo por 1,0, 1,2 ou 1,4 — é a variável
 * mais pesada da conta inteira, e nenhuma delas serve como padrão. Por
 * isso a pergunta aparece aqui, e a descrição de cada um é o que se
 * enxerga no espelho, sem uma palavra de fisiologia.
 */
function EscolhaBiotipo({ atual }: { atual: Biotipo | null }) {
  const [enviando, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <span className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar-fraco">
        Biotipo
      </span>
      <div className="flex flex-col gap-1.5">
        {BIOTIPOS.map((valor) => (
          <button
            key={valor}
            type="button"
            disabled={enviando}
            aria-pressed={atual === valor}
            onClick={() => iniciar(() => void salvarBiotipo(valor))}
            className={`flex min-h-11 flex-col gap-0.5 rounded-[10px] px-3.5 py-2.5 text-left transition-colors duration-200 disabled:opacity-60 ${
              atual === valor ? "bg-superficie3" : "bg-superficie3/40"
            }`}
          >
            <span
              className={`text-[16px] ${
                atual === valor ? "text-texto" : "text-auxiliar"
              }`}
            >
              {ROTULO_BIOTIPO[valor]}
            </span>
            <span className="text-[13.5px] leading-[1.4] text-auxiliar-fraco">
              {DESCRICAO_BIOTIPO[valor]}
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
