"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Mic, Play, Square, X } from "lucide-react";
import type { Funcao } from "@/lib/frases/modelo";
import { salvarGravacao, apagarGravacao } from "@/lib/gravacoes/acoes";

/** Uma frase lida devagar não passa disso; evita gravação esquecida aberta. */
const DURACAO_MAXIMA_MS = 30_000;

const TIPOS_PREFERIDOS = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function tipoSuportado() {
  if (typeof MediaRecorder === "undefined") return null;
  return TIPOS_PREFERIDOS.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}

type Estado = "parado" | "gravando" | "enviando" | "tocando";

export default function GravacaoFrase({
  funcao,
  caminhoAtual,
  urlGravacao,
  children,
}: {
  funcao: Funcao;
  caminhoAtual: string;
  urlGravacao: string | null;
  /** Controles da mesma linha que não são de áudio (Editar, indicador). */
  children?: ReactNode;
}) {
  const [estado, setEstado] = useState<Estado>("parado");
  const [erro, setErro] = useState<string | null>(null);
  const [urlLocal, setUrlLocal] = useState<string | null>(null);
  const [apagada, setApagada] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const pedacosRef = useRef<Blob[]>([]);
  const limiteRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const url = apagada ? null : (urlLocal ?? urlGravacao);
  const temGravacao = url !== null;

  useEffect(() => {
    return () => {
      if (limiteRef.current) clearTimeout(limiteRef.current);
      recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function encerrarMicrofone() {
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    if (limiteRef.current) {
      clearTimeout(limiteRef.current);
      limiteRef.current = null;
    }
  }

  async function comecarAGravar() {
    setErro(null);
    audioRef.current?.pause();

    if (!navigator.mediaDevices?.getUserMedia || !tipoSuportado()) {
      setErro("Este aparelho não grava áudio pelo navegador.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = tipoSuportado()!;
      const recorder = new MediaRecorder(stream, { mimeType });
      pedacosRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) pedacosRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(pedacosRef.current, { type: mimeType });
        encerrarMicrofone();
        enviar(blob, mimeType);
      };

      recorderRef.current = recorder;
      recorder.start();
      setEstado("gravando");
      limiteRef.current = setTimeout(pararDeGravar, DURACAO_MAXIMA_MS);
    } catch {
      setErro("Sem acesso ao microfone. Libere a permissão e tente de novo.");
      setEstado("parado");
    }
  }

  function pararDeGravar() {
    if (recorderRef.current?.state === "recording") {
      setEstado("enviando");
      recorderRef.current.stop();
    }
  }

  async function enviar(blob: Blob, mimeType: string) {
    const extensao = mimeType.startsWith("audio/mp4") ? "m4a" : "webm";
    const arquivo = new File([blob], `${funcao}.${extensao}`, {
      type: mimeType,
    });
    const fd = new FormData();
    fd.set("audio", arquivo);

    try {
      await salvarGravacao(funcao, caminhoAtual, fd);
      setUrlLocal((anterior) => {
        if (anterior) URL.revokeObjectURL(anterior);
        return URL.createObjectURL(blob);
      });
      setApagada(false);
      setEstado("parado");
    } catch {
      setErro("Não deu para salvar a gravação. Tente de novo.");
      setEstado("parado");
    }
  }

  function ouvir() {
    const audio = audioRef.current;
    if (!audio || !url) return;
    if (estado === "tocando") {
      audio.pause();
      audio.currentTime = 0;
      setEstado("parado");
      return;
    }
    audio.play().then(
      () => setEstado("tocando"),
      () => setErro("Não deu para tocar a gravação."),
    );
  }

  async function apagar() {
    setUrlLocal((anterior) => {
      if (anterior) URL.revokeObjectURL(anterior);
      return null;
    });
    setApagada(true);
    audioRef.current?.pause();
    setEstado("parado");
    await apagarGravacao(funcao, caminhoAtual);
  }

  const gravando = estado === "gravando";

  return (
    <div className="flex flex-col gap-1">
      <div className="tipo-rotulo flex items-center gap-5 text-[10px] tracking-[.16em]">
        <button
          type="button"
          onClick={ouvir}
          disabled={!temGravacao || gravando}
          className={`flex items-center gap-1.5 ${
            temGravacao && !gravando ? "text-auxiliar" : "text-auxiliar-fraco"
          }`}
        >
          <Play className="h-[13px] w-[13px]" strokeWidth={1.5} />
          {estado === "tocando" ? "Parar" : "Ouvir"}
        </button>

        <button
          type="button"
          onClick={gravando ? pararDeGravar : comecarAGravar}
          disabled={estado === "enviando"}
          className={`flex items-center gap-1.5 ${
            gravando ? "text-acento" : "text-auxiliar"
          }`}
        >
          {gravando ? (
            <Square className="h-[13px] w-[13px]" strokeWidth={1.5} />
          ) : (
            <Mic className="h-[13px] w-[13px]" strokeWidth={1.5} />
          )}
          {gravando
            ? "Parar"
            : estado === "enviando"
              ? "Salvando"
              : temGravacao
                ? "Regravar"
                : "Gravar"}
        </button>

        {temGravacao && !gravando && (
          <button
            type="button"
            onClick={apagar}
            aria-label="Apagar gravação"
            className="text-auxiliar-fraco"
          >
            <X className="h-[13px] w-[13px]" strokeWidth={1.5} />
          </button>
        )}

        {children}
      </div>

      {erro && <p className="text-[11px] text-erro">{erro}</p>}

      {url && (
        <audio
          ref={audioRef}
          src={url}
          onEnded={() => setEstado("parado")}
          preload="none"
        />
      )}
    </div>
  );
}
