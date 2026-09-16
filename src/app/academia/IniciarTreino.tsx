"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { iniciarSessao } from "@/lib/academia/acoes";
import { DIAS_ABREV } from "@/lib/academia/semana";

type Opcao = {
  id: string;
  nome: string;
  dias: number[];
  totalExercicios: number;
  deHoje: boolean;
};

/**
 * Começar o treino.
 *
 * O treino do dia já vem escolhido — na esmagadora maioria das vezes é ele
 * mesmo. Mas o corpo de segunda às vezes não é o corpo que a agenda previu,
 * então trocar está a um toque, e não escondido em outra tela.
 */
export default function IniciarTreino({
  opcoes,
  data,
}: {
  opcoes: Opcao[];
  data: string;
}) {
  const sugerido = opcoes.find((o) => o.deHoje) ?? opcoes[0];
  const [escolhido, setEscolhido] = useState(sugerido?.id ?? "");
  const [abrindo, setAbrindo] = useState(false);
  const [indo, setIndo] = useState(false);

  if (opcoes.length === 0) return null;

  const atual = opcoes.find((o) => o.id === escolhido) ?? sugerido;

  function comecar() {
    if (!atual || indo) return;
    setIndo(true);
    iniciarSessao(atual.id, data);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={comecar}
        disabled={indo}
        className="botao-acento tipo-rotulo flex w-full items-center justify-center gap-2.5 rounded-[14px] py-5 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
      >
        <Play className="h-[18px] w-[18px]" strokeWidth={2} />
        {indo ? "Abrindo" : "Iniciar treino"}
      </button>

      <div className="bloco flex flex-col">
        <button
          type="button"
          onClick={() => setAbrindo((a) => !a)}
          className="flex min-h-14 items-center justify-between gap-3 px-4 text-left"
        >
          <span className="flex flex-col gap-0.5">
            <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar-fraco">
              {atual?.deHoje ? "O treino de hoje" : "Trocado para hoje"}
            </span>
            <span className="text-[16px] text-texto">{atual?.nome}</span>
          </span>
          <span className="tipo-rotulo shrink-0 text-[10px] tracking-[.16em] text-auxiliar">
            {abrindo ? "fechar" : "trocar"}
          </span>
        </button>

        {abrindo && (
          <div className="flex flex-col px-4 pb-2">
            {opcoes.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => {
                  setEscolhido(opcao.id);
                  setAbrindo(false);
                }}
                className="flex min-h-12 items-center justify-between gap-3 text-left"
              >
                <span
                  className={`text-[15px] ${
                    opcao.id === escolhido ? "text-acento" : "text-texto"
                  }`}
                >
                  {opcao.nome}
                </span>
                <span className="tipo-rotulo shrink-0 text-[9px] tracking-[.18em] text-auxiliar-fraco">
                  {opcao.dias.length
                    ? opcao.dias.map((d) => DIAS_ABREV[d]).join(" ")
                    : "sem dia"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
