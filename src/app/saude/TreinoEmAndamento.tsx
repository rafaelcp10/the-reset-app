"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Timer } from "lucide-react";
import { duracaoSegundos, formatarDuracao } from "@/lib/saude/sessao";
import Painel from "@/components/saude/Painel";

/**
 * O treino que está correndo, no lugar do botão de começar.
 *
 * Antes, com sessão aberta, a aba de Saúde redirecionava direto para ela:
 * a ideia era não convidar a abandonar o que já tinha começado. Na prática
 * trancava a pessoa dentro do treino — conferir a água, o quanto comer ou
 * a carga de um mês atrás no meio da série virava impossível, e é
 * exatamente quando essas coisas são consultadas.
 *
 * Agora a aba abre normalmente, e o treino em curso ocupa o lugar do botão
 * de começar: é a coisa mais importante da tela, leva o âmbar, e voltar
 * para ele é um toque. Começar outro não aparece — existe uma sessão só
 * por vez, de propósito.
 *
 * O tempo sai do `inicio` guardado no banco, como no cronômetro da sessão:
 * contar no navegador erraria depois de a tela apagar.
 */
export default function TreinoEmAndamento({
  treinoId,
  nome,
  inicio,
}: {
  treinoId: string;
  nome: string;
  inicio: string;
}) {
  const [segundos, setSegundos] = useState(() =>
    duracaoSegundos({ inicio, fim: null }),
  );

  useEffect(() => {
    const acertar = () => setSegundos(duracaoSegundos({ inicio, fim: null }));
    // De meio em meio minuto basta: o painel mostra minutos, não segundos.
    const relogio = setInterval(acertar, 30_000);
    document.addEventListener("visibilitychange", acertar);
    return () => {
      clearInterval(relogio);
      document.removeEventListener("visibilitychange", acertar);
    };
  }, [inicio]);

  return (
    <Painel icone={Timer} rotulo="Em andamento">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-[20px] leading-[1.25] text-texto">{nome}</p>
        <span className="shrink-0 text-[16px] tabular-nums text-auxiliar">
          {formatarDuracao(segundos)}
        </span>
      </div>

      <Link
        href={`/saude/treinos/${treinoId}/sessao`}
        className="botao-acento tipo-rotulo mt-1 flex w-full items-center justify-center rounded-[12px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
      >
        Voltar ao treino
      </Link>
    </Painel>
  );
}
