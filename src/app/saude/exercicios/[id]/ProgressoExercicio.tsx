"use client";

import { useState } from "react";
import PainelSerie, { type FormatoNumero } from "@/components/saude/PainelSerie";
import { ParValor } from "@/components/saude/Painel";
import type { Metrica, Progresso } from "@/lib/saude/progresso";

const COMO: Record<
  Metrica,
  { rotulo: string; pilula: string; unidade: string; formato: FormatoNumero; nota: string }
> = {
  carga: {
    rotulo: "Maior carga",
    pilula: "Carga",
    unidade: "kg",
    formato: "enxuto",
    nota: "A série mais pesada de cada treino.",
  },
  volume: {
    rotulo: "Volume",
    pilula: "Volume",
    unidade: "kg",
    formato: "milhar",
    nota: "Repetições vezes carga, somadas em todas as séries.",
  },
  repeticoes: {
    rotulo: "Repetições",
    pilula: "Repetições",
    unidade: "reps",
    formato: "enxuto",
    nota: "Todas as repetições do treino, somadas.",
  },
};

/**
 * A curva do exercício, com a troca entre maior carga e volume.
 *
 * É o que Hevy, Strong e Liftosaur fazem, sem o que eles põem em volta: sem
 * troféu de recorde, sem "força estimada" e sem nível comparado com outros
 * usuários. Carga que desceu aparece com o mesmo peso de carga que subiu.
 *
 * O volume existe porque a carga máxima sozinha esconde progresso: quem
 * passou de 3×8 para 3×10 com o mesmo peso levantou 25% a mais, e na curva
 * de carga isso é uma linha reta.
 *
 * A troca mora no cabeçalho, no lugar do "+" da Evolução, e só aparece
 * quando há duas coisas para trocar — botão que não muda nada é ruído.
 */
export default function ProgressoExercicio({
  progresso,
  treinos,
}: {
  progresso: Progresso;
  treinos: number;
}) {
  const [metrica, setMetrica] = useState<Metrica>(progresso.metricas[0]);
  const pontos = progresso[metrica];
  const como = COMO[metrica];

  if (pontos.length === 0) return null;

  const troca =
    progresso.metricas.length > 1 ? (
      <div className="-my-2 -mr-2 flex gap-1">
        {progresso.metricas.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={metrica === m}
            onClick={() => setMetrica(m)}
            className={`tipo-rotulo min-h-11 rounded-[8px] px-2.5 text-[13.5px] tracking-[.06em] transition-colors duration-200 ${
              metrica === m ? "bg-superficie3 text-texto" : "text-auxiliar-fraco"
            }`}
          >
            {COMO[m].pilula}
          </button>
        ))}
      </div>
    ) : undefined;

  return (
    // A chave remonta o painel na troca: o ponto escolhido numa curva não
    // tem sentido na outra, e o índice antigo apontaria para outro treino.
    <PainelSerie
      key={metrica}
      rotulo={como.rotulo}
      unidade={como.unidade}
      pontos={pontos}
      formato={como.formato}
      descricao={`${como.rotulo}, ${pontos.length} ${pontos.length === 1 ? "treino" : "treinos"}. Arraste para ver cada um.`}
      acao={troca}
      rodape={
        <div className="flex flex-col gap-1 pt-1">
          <ParValor
            valor={String(treinos)}
            rotulo={treinos === 1 ? "treino" : "treinos"}
          />
          <p className="text-[15px] leading-[1.5] text-auxiliar-fraco">
            {como.nota}
          </p>
        </div>
      }
    />
  );
}
