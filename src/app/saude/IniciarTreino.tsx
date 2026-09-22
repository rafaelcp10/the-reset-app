"use client";

import { useState } from "react";
import { Dumbbell, Play } from "lucide-react";
import { iniciarSessao } from "@/lib/saude/acoes";
import { DIAS_ABREV } from "@/lib/saude/semana";
import Painel, { LinhaDoPainel, ParValor } from "@/components/saude/Painel";

type Opcao = {
  id: string;
  nome: string;
  dias: number[];
  totalExercicios: number;
  deHoje: boolean;
};

/**
 * O painel de hoje: qual treino é, e o botão de começar.
 *
 * O treino do dia já vem escolhido — na esmagadora maioria das vezes é ele
 * mesmo. Mas o corpo de segunda às vezes não é o corpo que a agenda previu,
 * então trocar está a um toque, e não escondido em outra tela.
 *
 * O painel inteiro é cliente porque o cabeçalho e o nome precisam seguir a
 * troca: mostrar "Peito e tríceps" no topo enquanto o botão abre outro
 * treino seria pior do que não mostrar nada.
 *
 * O âmbar da aba é este botão — é a única coisa aqui que a pessoa veio
 * fazer. Tudo o mais é informação.
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
    <Painel
      icone={Dumbbell}
      rotulo={
        atual?.deHoje
          ? "Hoje tem treino"
          : sugerido?.deHoje
            ? "Trocado para hoje"
            : "Hoje é descanso"
      }
      acao={
        opcoes.length > 1 ? (
          <button
            type="button"
            onClick={() => setAbrindo((a) => !a)}
            className="tipo-rotulo -mr-1 min-h-11 px-2 text-[13.5px] tracking-[.1em] text-auxiliar"
          >
            {abrindo ? "fechar" : "trocar"}
          </button>
        ) : null
      }
    >
      <div className="flex flex-col gap-1">
        <span className="text-[22px] leading-[1.2] text-texto">
          {atual?.nome}
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <ParValor
            valor={String(atual?.totalExercicios ?? 0)}
            rotulo={atual?.totalExercicios === 1 ? "exercício" : "exercícios"}
          />
          {atual && atual.dias.length > 0 && (
            <ParValor
              valor={atual.dias.map((d) => DIAS_ABREV[d]).join(" · ")}
              rotulo="na semana"
            />
          )}
        </div>
      </div>

      {abrindo && (
        <div className="flex flex-col gap-2">
          {opcoes.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => {
                setEscolhido(opcao.id);
                setAbrindo(false);
              }}
              className="text-left"
            >
              <LinhaDoPainel
                titulo={opcao.nome}
                detalhe={
                  opcao.dias.length
                    ? opcao.dias.map((d) => DIAS_ABREV[d]).join(" · ")
                    : "sem dia marcado"
                }
                valor={String(opcao.totalExercicios)}
              />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={comecar}
        disabled={indo}
        className="botao-acento tipo-rotulo mt-1 flex w-full items-center justify-center gap-2.5 rounded-[12px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60"
      >
        <Play className="h-[20px] w-[20px]" strokeWidth={2} />
        {indo ? "Abrindo" : "Iniciar treino"}
      </button>
    </Painel>
  );
}
