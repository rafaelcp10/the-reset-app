"use client";

import { useTransition } from "react";
import { salvarObjetivo } from "@/lib/saude/acoes";
import {
  OBJETIVOS,
  ROTULO_OBJETIVO,
  type Objetivo,
} from "@/lib/saude/nutricao";

/**
 * O objetivo, dentro do painel dos números.
 *
 * Ele morava no fim da tela, no painel de ajustes, e o Rafael passou dias
 * com a conta em "ganhar massa" sem achar onde trocar. É o controle que
 * mais mexe no resultado — 35% entre as pontas — então fica onde o
 * resultado está, e trocar muda os três números logo acima na hora.
 *
 * Sem descrição em cada opção aqui: o "20% abaixo do gasto" já está escrito
 * no rodapé do painel, e repetir em três linhas encheria a tela do que ela
 * não precisa. A explicação por extenso mora na engrenagem.
 */
export default function EscolhaObjetivo({ atual }: { atual: Objetivo }) {
  const [enviando, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      {/* O rótulo não é enfeite: sem ele, estas três linhas ficam iguais às
          três dos dias logo abaixo, e a tela passa a ter seis linhas que
          parecem a mesma lista. */}
      <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco">
        Objetivo
      </span>
      {OBJETIVOS.map((opcao) => (
        <button
          key={opcao}
          type="button"
          disabled={enviando}
          aria-pressed={atual === opcao}
          onClick={() => iniciar(() => void salvarObjetivo(opcao))}
          className={`flex min-h-11 items-center rounded-[10px] px-3.5 text-left text-[16px] transition-colors duration-200 disabled:opacity-60 ${
            atual === opcao
              ? "bg-superficie3 text-texto"
              : "bg-superficie3/40 text-auxiliar"
          }`}
        >
          {ROTULO_OBJETIVO[opcao]}
        </button>
      ))}
    </div>
  );
}
