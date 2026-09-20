"use client";

import { useOptimistic, useTransition } from "react";
import { Droplet, Undo2 } from "lucide-react";
import { registrarAgua } from "@/lib/saude/acoes";
import { emLitros, montarAgua, type Agua } from "@/lib/saude/agua";
import Painel from "@/components/saude/Painel";
import AnelAgua from "@/components/saude/AnelAgua";
import { vibrarMarcacao } from "@/lib/ui/sensorial";

/**
 * A água de hoje, contada em garrafas.
 *
 * O anel mostra o percentual do dia, dividido em garrafas; ao lado dele,
 * o que **falta** — a mesma escolha do painel de tarefas. Percentual e
 * garrafa respondem a perguntas diferentes: um diz onde estou no dia, o
 * outro diz o que fazer agora.
 *
 * O botão responde antes do servidor, como a marcação de tarefa: quem
 * acabou de beber não deve esperar a rede para ver a conta mudar.
 *
 * Passar da meta não vira nada — nem parabéns, nem barra que transborda.
 * Beber cinco garrafas num dia de calor é o corpo pedindo, não excesso.
 */
export default function ContadorAgua({
  data,
  agua,
  pesoKg,
}: {
  data: string;
  agua: Agua;
  pesoKg: number | null;
}) {
  const [otimista, aplicar] = useOptimistic(agua, (atual, deltaMl: number) =>
    montarAgua(pesoKg, atual.garrafaMl, Math.max(0, atual.bebidoMl + deltaMl)),
  );
  const [enviando, iniciar] = useTransition();

  function mexer(deltaMl: number) {
    vibrarMarcacao();
    iniciar(async () => {
      aplicar(deltaMl);
      await registrarAgua(data, deltaMl);
    });
  }

  if (!otimista.garrafaMl || otimista.metaMl === 0) {
    return (
      <Painel icone={Droplet} rotulo="Água">
        <p className="text-[15.5px] leading-[1.6] text-auxiliar">
          {otimista.metaMl === 0
            ? "Registre seu peso na Evolução para a conta de água sair."
            : "Diga o tamanho da sua garrafa na engrenagem da Saúde, e a conta aparece aqui."}
        </p>
      </Painel>
    );
  }

  const garrafa = otimista.garrafaMl;

  return (
    <Painel icone={Droplet} rotulo="Água">
      <div className="flex items-center gap-4">
        <AnelAgua
          bebidoMl={otimista.bebidoMl}
          metaMl={otimista.metaMl}
          garrafaMl={garrafa}
          garrafasNaMeta={otimista.garrafasNaMeta}
        />

        <div className="flex min-w-0 flex-col gap-2.5">
          <span className="flex flex-col gap-0.5">
            <span className="text-[30px] leading-none tabular-nums text-texto">
              {otimista.completou ? 0 : otimista.faltamGarrafas}
            </span>
            <span className="text-[14.5px] leading-[1.3] text-auxiliar">
              {otimista.completou
                ? "garrafas restantes"
                : `${otimista.faltamGarrafas === 1 ? "garrafa" : "garrafas"} de ${emLitros(garrafa)}`}
            </span>
          </span>

          <span className="flex flex-col gap-0.5">
            <span className="text-[15.5px] tabular-nums text-texto">
              {emLitros(otimista.bebidoMl)}
            </span>
            <span className="tipo-rotulo text-[12.5px] tracking-[.14em] text-auxiliar-fraco">
              de {emLitros(otimista.metaMl)}
            </span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={enviando}
          onClick={() => mexer(garrafa)}
          className="botao-acento tipo-rotulo flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[12px] py-3.5 text-center text-[15px] tracking-[.06em] text-fundo disabled:opacity-60"
        >
          <Droplet className="h-[18px] w-[18px]" strokeWidth={2} />
          Bebi uma garrafa
        </button>

        {otimista.bebidoMl > 0 && (
          <button
            type="button"
            disabled={enviando}
            aria-label="Desfazer a última garrafa"
            onClick={() => mexer(-garrafa)}
            className="-m-1 inline-flex min-h-11 shrink-0 items-center justify-center p-3 text-auxiliar disabled:opacity-60"
          >
            <Undo2 className="h-[20px] w-[20px]" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </Painel>
  );
}
