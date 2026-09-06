"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, X } from "lucide-react";
import { salvarPreferenciasRitual, concluirEspelho } from "@/lib/ritual/acoes";

type ItemFrase = { rotulo: string; texto: string };

const OPCOES_REPETICOES = [1, 3, 5] as const;
const TOTAL_PONTOS_RESPIRACAO = 10;
const INTERVALO_RESPIRACAO_MS = 700;
const TEMPO_POR_REPETICAO_MS = 6000;

export default function ModoEspelho({
  frases,
  musicaUrl,
  repeticoesIniciais,
  maosLivresInicial,
  linhaHojeInicial,
  dataHoje,
}: {
  frases: ItemFrase[];
  musicaUrl: string | null;
  repeticoesIniciais: number;
  maosLivresInicial: boolean;
  linhaHojeInicial: string | null;
  dataHoje: string;
}) {
  const ultimoPasso = frases.length + 1;
  const [passo, setPasso] = useState(0);
  const [repeticoes, setRepeticoes] = useState(
    OPCOES_REPETICOES.includes(repeticoesIniciais as (typeof OPCOES_REPETICOES)[number])
      ? repeticoesIniciais
      : 3,
  );
  const [maosLivres, setMaosLivres] = useState(maosLivresInicial);
  const [configAberta, setConfigAberta] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const avancar = useCallback(() => {
    setPasso((p) => Math.min(p + 1, ultimoPasso));
  }, [ultimoPasso]);

  // Toca a música assim que a cena abre — se o navegador bloquear o
  // autoplay ou a faixa falhar, o ritual segue normalmente e em silêncio.
  useEffect(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  // Respiração sempre avança sozinha; frases avançam sozinhas só no modo
  // mãos livres. Um toque sempre pode adiantar (o efeito é cancelado e
  // recriado a cada mudança de passo).
  useEffect(() => {
    // Pausa qualquer avanço automático enquanto o painel de preferências
    // está aberto — senão a cena troca sozinha enquanto o usuário nem está
    // olhando para ela.
    if (configAberta) return;

    if (passo === 0) {
      const duracao = (TOTAL_PONTOS_RESPIRACAO + 1) * INTERVALO_RESPIRACAO_MS;
      const t = setTimeout(avancar, duracao);
      return () => clearTimeout(t);
    }
    if (passo >= 1 && passo <= frases.length && maosLivres) {
      const t = setTimeout(avancar, repeticoes * TEMPO_POR_REPETICAO_MS);
      return () => clearTimeout(t);
    }
  }, [passo, maosLivres, repeticoes, avancar, frases.length, configAberta]);

  function alterarRepeticoes(valor: number) {
    setRepeticoes(valor);
    salvarPreferenciasRitual(valor, maosLivres).catch(() => {});
  }

  function alternarMaosLivres() {
    const novoValor = !maosLivres;
    setMaosLivres(novoValor);
    salvarPreferenciasRitual(repeticoes, novoValor).catch(() => {});
  }

  function aoTocarNaTela() {
    if (configAberta) return;
    if (passo >= 0 && passo <= frases.length) avancar();
  }

  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      {musicaUrl && <audio ref={audioRef} src={musicaUrl} loop />}

      <div className="flex items-center justify-between px-6 pt-6">
        <button
          type="button"
          onClick={() => setConfigAberta((v) => !v)}
          aria-label="Preferências do espelho"
          className="text-auxiliar"
        >
          <Settings className="h-5 w-5" strokeWidth={1.5} />
        </button>
        <Link href="/ritual" aria-label="Sair" className="text-auxiliar">
          <X className="h-6 w-6" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col" onClick={aoTocarNaTela}>
        {configAberta ? (
          <PainelPreferencias
            repeticoes={repeticoes}
            maosLivres={maosLivres}
            onEscolherRepeticoes={alterarRepeticoes}
            onAlternarMaosLivres={alternarMaosLivres}
            onFechar={() => setConfigAberta(false)}
          />
        ) : passo === 0 ? (
          <TelaRespiracao />
        ) : passo <= frases.length ? (
          <TelaFrase item={frases[passo - 1]} repeticoes={repeticoes} />
        ) : (
          <TelaEncerramento
            linhaInicial={linhaHojeInicial}
            dataHoje={dataHoje}
          />
        )}
      </div>
    </div>
  );
}

function TelaRespiracao() {
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    if (ativo >= TOTAL_PONTOS_RESPIRACAO - 1) return;
    const t = setTimeout(() => setAtivo((a) => a + 1), INTERVALO_RESPIRACAO_MS);
    return () => clearTimeout(t);
  }, [ativo]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div className="flex gap-2">
        {Array.from({ length: TOTAL_PONTOS_RESPIRACAO }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
              i <= ativo ? "bg-texto" : "bg-auxiliar/25"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-auxiliar">Respire.</p>
    </div>
  );
}

function TelaFrase({
  item,
  repeticoes,
}: {
  item: ItemFrase;
  repeticoes: number;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-auxiliar">
          {item.rotulo}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: repeticoes }).map((_, i) => (
            <span key={i} className="h-1 w-4 rounded-full bg-auxiliar/30" />
          ))}
        </div>
      </div>

      <p className="font-frase text-3xl leading-relaxed">{item.texto}</p>

      <div className="flex items-center justify-center gap-8">
        <button type="button" disabled className="text-sm text-auxiliar/40">
          ouvir
        </button>
        <button type="button" disabled className="text-sm text-auxiliar/40">
          gravar
        </button>
      </div>
    </div>
  );
}

function TelaEncerramento({
  linhaInicial,
  dataHoje,
}: {
  linhaInicial: string | null;
  dataHoje: string;
}) {
  return (
    <form
      action={concluirEspelho.bind(null, dataHoje)}
      onClick={(e) => e.stopPropagation()}
      className="flex flex-1 flex-col justify-between px-6 py-16"
    >
      <h1 className="font-frase text-2xl leading-relaxed">A linha de hoje</h1>

      <textarea
        name="linha"
        defaultValue={linhaInicial ?? ""}
        autoFocus
        placeholder="O que você vai fazer hoje?"
        rows={3}
        className="resize-none bg-transparent font-frase text-2xl leading-relaxed outline-none placeholder:text-auxiliar/50"
      />

      <button
        type="submit"
        className="w-full rounded-full bg-texto py-3 text-center font-interface font-medium text-fundo"
      >
        Concluir
      </button>
    </form>
  );
}

function PainelPreferencias({
  repeticoes,
  maosLivres,
  onEscolherRepeticoes,
  onAlternarMaosLivres,
  onFechar,
}: {
  repeticoes: number;
  maosLivres: boolean;
  onEscolherRepeticoes: (valor: number) => void;
  onAlternarMaosLivres: () => void;
  onFechar: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-1 flex-col justify-center gap-10 px-6"
    >
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-auxiliar">
          Repetições por frase
        </span>
        <div className="flex gap-2">
          {OPCOES_REPETICOES.map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => onEscolherRepeticoes(valor)}
              className={`flex-1 rounded-2xl py-3 text-center font-medium ${
                repeticoes === valor
                  ? "bg-texto text-fundo"
                  : "bg-texto/5 text-texto"
              }`}
            >
              {valor}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-texto">Modo mãos livres</p>
          <p className="text-xs text-auxiliar">
            Avança sozinho, sem precisar tocar.
          </p>
        </div>
        <button
          type="button"
          onClick={onAlternarMaosLivres}
          aria-label="Alternar modo mãos livres"
          className={`h-7 w-12 shrink-0 rounded-full p-1 transition-colors ${
            maosLivres ? "bg-texto" : "bg-texto/10"
          }`}
        >
          <span
            className={`block h-5 w-5 rounded-full bg-fundo transition-transform ${
              maosLivres ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={onFechar}
        className="self-center text-sm text-auxiliar underline underline-offset-4"
      >
        fechar
      </button>
    </div>
  );
}
