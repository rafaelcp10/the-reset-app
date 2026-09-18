"use client";

import { useOptimistic, useTransition } from "react";
import { Droplet, Undo2 } from "lucide-react";
import { registrarAgua } from "@/lib/saude/acoes";
import { emLitros, montarAgua, type Agua } from "@/lib/saude/agua";
import Painel, { Barra } from "@/components/saude/Painel";
import { vibrarMarcacao } from "@/lib/ui/sensorial";

/**
 * A água de hoje, contada em garrafas.
 *
 * O número grande é **quantas faltam**, não quantas foram — a mesma
 * escolha do painel de tarefas. Uma lista existe para mostrar o que ainda
 * está de pé, e zerada ela diz zero.
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
            : "Diga o tamanho da sua garrafa, ali embaixo, e a conta aparece aqui."}
        </p>
      </Painel>
    );
  }

  const garrafa = otimista.garrafaMl;

  return (
    <Painel icone={Droplet} rotulo="Água">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[34px] leading-none tabular-nums text-texto">
          {otimista.completou ? 0 : otimista.faltamGarrafas}
        </span>
        <span className="text-[15px] text-auxiliar">
          {otimista.completou
            ? "garrafas restantes"
            : `${otimista.faltamGarrafas === 1 ? "garrafa" : "garrafas"} de ${emLitros(garrafa)}`}
        </span>
      </div>

      <Barra feito={otimista.bebidoMl} total={otimista.metaMl} />

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15.5px] tabular-nums text-texto">
            {emLitros(otimista.bebidoMl)}
          </span>
          <span className="tipo-rotulo text-[12.5px] tracking-[.14em] text-auxiliar-fraco">
            de {emLitros(otimista.metaMl)}
          </span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[15.5px] tabular-nums text-texto">
            {otimista.garrafasBebidas}
          </span>
          <span className="tipo-rotulo text-[12.5px] tracking-[.14em] text-auxiliar-fraco">
            de {otimista.garrafasNaMeta} garrafas
          </span>
        </span>
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
