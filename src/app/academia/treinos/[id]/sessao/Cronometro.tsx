"use client";

import { useEffect, useState } from "react";
import { Square } from "lucide-react";
import { descartarSessao, encerrarSessao } from "@/lib/academia/acoes";
import { duracaoSegundos } from "@/lib/academia/sessao";

/**
 * O cronômetro do treino.
 *
 * O tempo é sempre calculado a partir do `inicio` guardado no banco, e
 * nunca contado no navegador. Assim ele continua certo depois de a tela
 * apagar, o app ir para segundo plano ou o celular ficar no bolso entre
 * duas séries — que é o uso normal, não a exceção.
 */
export default function Cronometro({
  sessaoId,
  treinoId,
  inicio,
}: {
  sessaoId: string;
  treinoId: string;
  inicio: string;
}) {
  const [segundos, setSegundos] = useState(() =>
    duracaoSegundos({ inicio, fim: null }),
  );
  const [encerrando, setEncerrando] = useState(false);

  useEffect(() => {
    const relogio = setInterval(
      () => setSegundos(duracaoSegundos({ inicio, fim: null })),
      1000,
    );
    // Voltar do segundo plano não espera o próximo tique para acertar.
    const aoVoltar = () => setSegundos(duracaoSegundos({ inicio, fim: null }));
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(relogio);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [inicio]);

  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const relogio =
    h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;

  return (
    <div className="bloco-vez flex flex-col gap-4 rounded-[14px] px-5 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="tipo-rotulo text-[11px] tracking-[.22em] text-auxiliar">
          Em treino
        </span>
        <span className="cronometro text-[34px] leading-none text-texto">
          {relogio}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={encerrando}
          onClick={() => {
            setEncerrando(true);
            encerrarSessao(sessaoId, treinoId);
          }}
          className="pilula tipo-rotulo flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] text-center text-[12px] tracking-[.09em] text-texto disabled:opacity-50"
        >
          <Square className="h-[13px] w-[13px]" strokeWidth={2} />
          {encerrando ? "Encerrando" : "Finalizar treino"}
        </button>
        <button
          type="button"
          disabled={encerrando}
          onClick={() => {
            setEncerrando(true);
            descartarSessao(sessaoId, treinoId);
          }}
          className="shrink-0 text-[13px] text-auxiliar-fraco underline underline-offset-4"
        >
          descartar
        </button>
      </div>
    </div>
  );
}
