"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type ItemLoop = {
  rotulo: string;
  texto: string;
  url: string;
};

/** Pausa entre uma frase e a seguinte, para não virar enxurrada. */
const RESPIRO_MS = 1800;

/**
 * As frases gravadas na própria voz, em sequência e em repetição, por cima
 * da música. A tela pode ficar guardada: aqui não há nada para tocar.
 */
export default function LoopDeVoz({
  itens,
  musicaUrl,
}: {
  itens: ItemLoop[];
  musicaUrl: string | null;
}) {
  const [indice, setIndice] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [voltas, setVoltas] = useState(0);

  const vozRef = useRef<HTMLAudioElement>(null);
  const musicaRef = useRef<HTMLAudioElement>(null);
  const proximaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Copiados agora: na limpeza os refs já podem apontar para outra coisa,
    // e o áudio ficaria tocando depois de sair da tela.
    const voz = vozRef.current;
    const musica = musicaRef.current;
    return () => {
      if (proximaRef.current) clearTimeout(proximaRef.current);
      voz?.pause();
      musica?.pause();
    };
  }, []);

  // Mantém a tela acordada enquanto toca — o celular no bolso não deve
  // interromper o áudio, mas a tela apagando não pode parar nada.
  useEffect(() => {
    if (!tocando) return;
    let sentinela: WakeLockSentinel | null = null;
    const pedir = async () => {
      try {
        sentinela = await navigator.wakeLock?.request("screen");
      } catch {
        // Sem wake lock o áudio continua; só a tela apaga.
      }
    };
    pedir();
    return () => {
      sentinela?.release().catch(() => {});
    };
  }, [tocando]);

  function tocarIndice(i: number) {
    const audio = vozRef.current;
    if (!audio) return;
    audio.src = itens[i].url;
    audio.play().catch(() => setTocando(false));
  }

  function comecar() {
    setTocando(true);
    musicaRef.current?.play().catch(() => {});
    tocarIndice(indice);
  }

  function parar() {
    if (proximaRef.current) clearTimeout(proximaRef.current);
    vozRef.current?.pause();
    musicaRef.current?.pause();
    setTocando(false);
  }

  function aoTerminarFrase() {
    proximaRef.current = setTimeout(() => {
      const proximo = (indice + 1) % itens.length;
      if (proximo === 0) setVoltas((v) => v + 1);
      setIndice(proximo);
      tocarIndice(proximo);
    }, RESPIRO_MS);
  }

  const atual = itens[indice];

  return (
    <div className="flex min-h-screen flex-col px-6 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <span className="tipo-rotulo text-[10.5px] tracking-[.18em] text-auxiliar">
          Na sua voz{voltas > 0 ? ` · ${voltas + 1}ª volta` : ""}
        </span>
        <Link
          href="/ritual"
          className="tipo-rotulo -m-3 inline-flex p-3 text-[10.5px] tracking-[.18em] text-auxiliar"
        >
          Sair
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4 py-10">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar">
          {atual.rotulo}
        </span>
        <p
          key={indice}
          className="entrada-frase text-[26px] leading-[1.5] text-texto"
        >
          {atual.texto}
        </p>
      </div>

      <button
        type="button"
        onClick={tocando ? parar : comecar}
        className={`tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] ${
          tocando
            ? "pilula text-texto"
            : "botao-acento text-fundo"
        }`}
      >
        {tocando ? "Parar" : "Começar"}
      </button>

      <audio ref={vozRef} onEnded={aoTerminarFrase} preload="auto" />
      {musicaUrl && <audio ref={musicaRef} src={musicaUrl} loop preload="none" />}
    </div>
  );
}
