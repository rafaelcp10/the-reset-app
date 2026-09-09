"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mic, Music, Play, Square } from "lucide-react";
import { concluirEspelho } from "@/lib/ritual/acoes";

type ItemFrase = {
  rotulo: string;
  texto: string;
  palavraEscolhida: string | null;
  urlGravacao: string | null;
};

const OPCOES_REPETICOES = [1, 3, 5] as const;
const TOTAL_PONTOS_RESPIRACAO = 10;
const DURACAO_RESPIRACAO_AUTOMATICA_MS = 30_000;
const TEMPO_POR_REPETICAO_MS = 7_000;
const DURACAO_ECO_MS = 2200;

export default function ModoEspelho({
  frases,
  musicaUrl,
  musicaNome,
  repeticoesIniciais,
  maosLivresInicial,
  dataHoje,
}: {
  frases: ItemFrase[];
  musicaUrl: string | null;
  musicaNome: string | null;
  repeticoesIniciais: number;
  maosLivresInicial: boolean;
  dataHoje: string;
}) {
  // passos: 0 = respiração, 1..N = frases, N+1 = eco
  const passoEco = frases.length + 1;
  const [passo, setPasso] = useState(0);
  const [concluindo, setConcluindo] = useState(false);

  const repeticoes = OPCOES_REPETICOES.includes(
    repeticoesIniciais as (typeof OPCOES_REPETICOES)[number],
  )
    ? repeticoesIniciais
    : 3;
  const maosLivres = maosLivresInicial;

  const audioRef = useRef<HTMLAudioElement>(null);

  const avancar = useCallback(() => {
    setPasso((p) => Math.min(p + 1, passoEco));
  }, [passoEco]);

  useEffect(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    if (passo === 0 && maosLivres) {
      const t = setTimeout(avancar, DURACAO_RESPIRACAO_AUTOMATICA_MS);
      return () => clearTimeout(t);
    }
    if (passo >= 1 && passo <= frases.length && maosLivres) {
      const t = setTimeout(avancar, repeticoes * TEMPO_POR_REPETICAO_MS);
      return () => clearTimeout(t);
    }
    if (passo === passoEco) {
      const t = setTimeout(() => setConcluindo(true), DURACAO_ECO_MS);
      return () => clearTimeout(t);
    }
  }, [passo, maosLivres, repeticoes, avancar, frases.length, passoEco]);

  // Efeito separado: dispara a Server Action fora do corpo do outro efeito,
  // já que ela navega e não deve ser cancelada por uma limpeza de timeout.
  useEffect(() => {
    if (concluindo) concluirEspelho(dataHoje);
  }, [concluindo, dataHoje]);

  function aoTocarNaTela() {
    // toque avança respiração e frases; durante o eco é ignorado.
    if (passo <= frases.length) avancar();
  }

  const mostrandoRodape = passo <= frases.length;
  const palavraEco = frases[0]?.palavraEscolhida;

  return (
    <div className="flex min-h-screen flex-col">
      {musicaUrl && <audio ref={audioRef} src={musicaUrl} loop />}

      <div className="flex items-center justify-between px-6 pt-6">
        <span className="tipo-rotulo text-[10.5px] tracking-[.18em] text-auxiliar">
          {mostrandoRodape
            ? `Passo ${passo + 1} de ${frases.length + 1}${maosLivres ? " · Automático" : ""}`
            : ""}
        </span>
        <Link
          href="/ritual"
          className="tipo-rotulo -m-3 inline-flex p-3 text-[10.5px] tracking-[.18em] text-auxiliar"
        >
          Sair
        </Link>
      </div>

      <div className="flex flex-1 flex-col" onClick={aoTocarNaTela}>
        {passo === 0 ? (
          <TelaRespiracao />
        ) : passo <= frases.length ? (
          <TelaFrase
            key={passo}
            item={frases[passo - 1]}
            indice={passo}
            total={frases.length}
            repeticoes={repeticoes}
            maosLivres={maosLivres}
          />
        ) : (
          <TelaEco palavra={palavraEco} />
        )}
      </div>

      {mostrandoRodape && (
        <Rodape musicaUrl={musicaUrl} musicaNome={musicaNome} />
      )}
    </div>
  );
}

function TelaRespiracao() {
  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-[26px] leading-[1.3] text-texto">
          Respire dez vezes
        </h1>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          Puxe o ar pelo nariz e solte fundo pela boca. Os pontos marcam o
          ritmo — não precisa tocar em nada.
        </p>
      </div>

      {/* Os pontos ocupam o centro da tela: são eles que conduzem o tempo
          aqui, então recebem o espaço todo em vez de ficar num canto. */}
      <div className="flex flex-1 items-center justify-center gap-2.5">
        {Array.from({ length: TOTAL_PONTOS_RESPIRACAO }).map((_, i) => (
          <span
            key={i}
            className="pulso-respiracao h-2.5 w-2.5 rounded-full bg-acento"
            style={{
              animationDelay: `${i * 0.6}s`,
              boxShadow: "0 0 20px rgb(201 123 58 / 0.6)",
            }}
          />
        ))}
      </div>

      <button
        type="button"
        className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
      >
        Começar as frases
      </button>
    </div>
  );
}

function TelaFrase({
  item,
  indice,
  total,
  repeticoes,
  maosLivres,
}: {
  item: ItemFrase;
  indice: number;
  total: number;
  repeticoes: number;
  maosLivres: boolean;
}) {
  return (
    <div className="entrada-frase flex flex-1 flex-col justify-between px-6 py-8">
      <div className="flex flex-col gap-2">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar">
          {item.rotulo} · frase {indice} de {total}
        </span>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          {maosLivres
            ? "A frase passa sozinha."
            : `Leia em voz alta ${repeticoes} ${repeticoes === 1 ? "vez" : "vezes"}. Um toque segue para a próxima.`}
        </p>
      </div>

      <p className="text-[29px] leading-[1.5] text-texto">
        {formatarTexto(item.texto, item.palavraEscolhida)}
      </p>

      <div className="flex flex-col gap-3">
        <div
          onClick={(e) => e.stopPropagation()}
          className="tipo-rotulo flex items-center gap-4 text-[10px] tracking-[.16em]"
        >
          <OuvirGravacao url={item.urlGravacao} />
          <span className="flex items-center gap-1.5 text-auxiliar-fraco">
            <Mic className="h-[13px] w-[13px]" strokeWidth={1.5} />
            Gravar
          </span>
          <span className="rounded-[3px] bg-superficie2 px-1.5 py-0.5 text-auxiliar-fraco">
            Em breve
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: repeticoes }).map((_, i) => (
              <span key={i} className="h-[2px] w-4 bg-auxiliar-minimo" />
            ))}
          </div>
          <span className="tipo-rotulo text-[10px] tracking-[.16em] text-auxiliar-minimo">
            {repeticoes} {repeticoes === 1 ? "leitura" : "leituras"}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Ouvir a própria voz durante o ritual. Sai de cena junto com a frase —
 * TelaFrase é remontada a cada passo, então a limpeza corta o áudio se a
 * frase virar antes de a gravação terminar.
 */
function OuvirGravacao({ url }: { url: string | null }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  if (!url) {
    return (
      <span className="flex items-center gap-1.5 text-auxiliar-fraco">
        <Play className="h-[13px] w-[13px]" strokeWidth={1.5} />
        Ouvir
      </span>
    );
  }

  function alternar() {
    const audio = audioRef.current;
    if (!audio) return;
    if (tocando) {
      audio.pause();
      audio.currentTime = 0;
      setTocando(false);
      return;
    }
    audio.play().then(
      () => setTocando(true),
      () => setTocando(false),
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={alternar}
        className="flex items-center gap-1.5 text-texto"
      >
        {tocando ? (
          <Square className="h-[13px] w-[13px]" strokeWidth={1.5} />
        ) : (
          <Play className="h-[13px] w-[13px]" strokeWidth={1.5} />
        )}
        {tocando ? "Parar" : "Ouvir"}
      </button>
      <audio
        ref={audioRef}
        src={url}
        preload="none"
        onEnded={() => setTocando(false)}
      />
    </>
  );
}

/** Destaca a palavra que o usuário escolheu na frase de identidade. */
function formatarTexto(texto: string, palavraEscolhida: string | null) {
  if (!palavraEscolhida) return texto;
  const indice = texto.indexOf(palavraEscolhida);
  if (indice === -1) return texto;
  return (
    <>
      {texto.slice(0, indice)}
      <span className="text-acento">{palavraEscolhida}</span>
      {texto.slice(indice + palavraEscolhida.length)}
    </>
  );
}

function TelaEco({ palavra }: { palavra: string | null | undefined }) {
  return (
    <div className="entrada-eco relative flex flex-1 items-center justify-center overflow-hidden px-6">
      {/* A palavra não só aparece: ela acende a tela por trás. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[120vw] w-[120vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgb(201 123 58 / 0.22) 0%, rgb(201 123 58 / 0.07) 34%, transparent 66%)",
        }}
      />
      <p
        className="relative text-center text-[56px] font-semibold leading-[1.1] text-acento"
        style={{ textShadow: "0 0 48px rgb(201 123 58 / 0.45)" }}
      >
        {palavra || "presente"}.
      </p>
    </div>
  );
}

function Rodape({
  musicaUrl,
  musicaNome,
}: {
  musicaUrl: string | null;
  musicaNome: string | null;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="vidro flex flex-col gap-4 px-6 pb-8 pt-4"
    >
      <div className="flex items-center gap-2 text-[13px]">
        <Music className="h-4 w-4 shrink-0 text-auxiliar" strokeWidth={1.5} />
        <span className="flex-1 truncate text-auxiliar">
          {musicaUrl ? musicaNome || "Sua música" : "Sem música"}
        </span>
        <Link
          href="/musicas"
          className="shrink-0 text-auxiliar underline underline-offset-4"
        >
          {musicaUrl ? "trocar música" : "adicionar música"}
        </Link>
      </div>
      <div className="flex gap-1.5">
        <span className="h-[3px] w-[32px] rounded-full bg-acento" />
        <span className="h-[3px] w-[18px] rounded-full bg-auxiliar-fraco" />
      </div>
    </div>
  );
}
