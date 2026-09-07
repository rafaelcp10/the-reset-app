"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Music } from "lucide-react";
import { concluirEspelho, definirMusica } from "@/lib/ritual/acoes";

type ItemFrase = {
  rotulo: string;
  texto: string;
  palavraEscolhida: string | null;
};

const CAMINHO = "/ritual/espelho";
const OPCOES_REPETICOES = [1, 3, 5] as const;
const TOTAL_PONTOS_RESPIRACAO = 10;
const INTERVALO_RESPIRACAO_MS = 700;
const TEMPO_POR_REPETICAO_MS = 6000;

export default function ModoEspelho({
  frases,
  musicaUrl,
  musicaNome,
  repeticoesIniciais,
  maosLivresInicial,
  linhaHojeInicial,
  dataHoje,
}: {
  frases: ItemFrase[];
  musicaUrl: string | null;
  musicaNome: string | null;
  repeticoesIniciais: number;
  maosLivresInicial: boolean;
  linhaHojeInicial: string | null;
  dataHoje: string;
}) {
  const ultimoPasso = frases.length + 1;
  const totalPassosNumerados = frases.length + 1; // respiração + 5 frases
  const [passo, setPasso] = useState(0);

  // Repetições e mãos livres vêm das preferências do usuário — não são
  // configuráveis dentro do espelho (só o "sair" fica acessível aqui).
  const repeticoes = OPCOES_REPETICOES.includes(
    repeticoesIniciais as (typeof OPCOES_REPETICOES)[number],
  )
    ? repeticoesIniciais
    : 3;
  const maosLivres = maosLivresInicial;

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
    if (passo === 0) {
      const duracao = (TOTAL_PONTOS_RESPIRACAO + 1) * INTERVALO_RESPIRACAO_MS;
      const t = setTimeout(avancar, duracao);
      return () => clearTimeout(t);
    }
    if (passo >= 1 && passo <= frases.length && maosLivres) {
      const t = setTimeout(avancar, repeticoes * TEMPO_POR_REPETICAO_MS);
      return () => clearTimeout(t);
    }
  }, [passo, maosLivres, repeticoes, avancar, frases.length]);

  function aoTocarNaTela() {
    if (passo >= 0 && passo <= frases.length) avancar();
  }

  const mostrandoRodape = passo <= frases.length;

  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      {musicaUrl && <audio ref={audioRef} src={musicaUrl} loop />}

      <div className="flex items-center justify-between px-6 pt-6">
        <span className="text-xs uppercase tracking-wide text-auxiliar">
          {mostrandoRodape
            ? `Passo ${passo + 1} de ${totalPassosNumerados}`
            : ""}
        </span>
        <Link
          href="/ritual"
          className="text-xs uppercase tracking-wide text-auxiliar"
        >
          Sair
        </Link>
      </div>

      <div className="flex flex-1 flex-col" onClick={aoTocarNaTela}>
        {passo === 0 ? (
          <TelaRespiracao onComecar={avancar} />
        ) : passo <= frases.length ? (
          <TelaFrase
            item={frases[passo - 1]}
            indice={passo}
            total={frases.length}
            repeticoes={repeticoes}
          />
        ) : (
          <TelaEncerramento linhaInicial={linhaHojeInicial} dataHoje={dataHoje} />
        )}
      </div>

      {mostrandoRodape && (
        <RodapeMusica
          musicaUrl={musicaUrl}
          musicaNome={musicaNome}
          passo={passo}
          totalPassos={totalPassosNumerados}
        />
      )}
    </div>
  );
}

function TelaRespiracao({ onComecar }: { onComecar: () => void }) {
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    if (ativo >= TOTAL_PONTOS_RESPIRACAO - 1) return;
    const t = setTimeout(() => setAtivo((a) => a + 1), INTERVALO_RESPIRACAO_MS);
    return () => clearTimeout(t);
  }, [ativo]);

  return (
    <div className="flex flex-1 flex-col justify-between px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="font-frase text-3xl leading-relaxed text-texto">
          Respire dez vezes
        </h1>
        <p className="text-sm text-auxiliar">
          Puxe o ar pelo nariz e solte fundo pela boca. Os pontos marcam o
          ritmo — não precisa tocar em nada.
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: TOTAL_PONTOS_RESPIRACAO }).map((_, i) => (
          <span
            key={i}
            className={`h-2.5 w-2.5 rounded-full transition-colors duration-500 ${
              i <= ativo ? "bg-acento" : "bg-auxiliar/25"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onComecar();
        }}
        className="w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo"
      >
        Começar as frases
      </button>
    </div>
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

function TelaFrase({
  item,
  indice,
  total,
  repeticoes,
}: {
  item: ItemFrase;
  indice: number;
  total: number;
  repeticoes: number;
}) {
  return (
    <div className="flex flex-1 flex-col justify-between px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-auxiliar">
          {item.rotulo} · Frase {indice} de {total}
        </span>
        <p className="text-xs text-auxiliar">
          Leia em voz alta {repeticoes} {repeticoes === 1 ? "vez" : "vezes"}.
          Um toque segue para a próxima.
        </p>
      </div>

      <p className="font-frase text-3xl leading-relaxed text-texto">
        {formatarTexto(item.texto, item.palavraEscolhida)}
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-6 text-xs uppercase tracking-wide">
          <span className="text-auxiliar/40">Ouvir</span>
          <span className="text-auxiliar/40">Gravar</span>
          <span className="rounded-full bg-texto/5 px-2 py-0.5 text-auxiliar/60">
            Em breve
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: repeticoes }).map((_, i) => (
              <span key={i} className="h-1 w-4 rounded-full bg-auxiliar/30" />
            ))}
          </div>
          <span className="text-xs uppercase tracking-wide text-auxiliar/60">
            {repeticoes} {repeticoes === 1 ? "leitura" : "leituras"}
          </span>
        </div>
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
      <h1 className="font-frase text-2xl leading-relaxed text-acento">
        A linha de hoje
      </h1>

      <textarea
        name="linha"
        defaultValue={linhaInicial ?? ""}
        autoFocus
        placeholder="O que você vai fazer hoje?"
        rows={3}
        className="resize-none bg-transparent font-frase text-2xl leading-relaxed text-texto outline-none placeholder:text-auxiliar/50"
      />

      <button
        type="submit"
        className="w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo"
      >
        Concluir
      </button>
    </form>
  );
}

function RodapeMusica({
  musicaUrl,
  musicaNome,
  passo,
  totalPassos,
}: {
  musicaUrl: string | null;
  musicaNome: string | null;
  passo: number;
  totalPassos: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editando, setEditando] = useState(false);

  function salvar() {
    const url = inputRef.current?.value.trim();
    setEditando(false);
    if (!url) return;
    const fd = new FormData();
    fd.set("url", url);
    definirMusica(CAMINHO, fd).catch(() => {});
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="flex flex-col gap-3 px-6 pb-8 pt-4"
    >
      <div className="flex items-center gap-2 text-sm">
        <Music className="h-4 w-4 shrink-0 text-auxiliar" strokeWidth={1.5} />
        {editando ? (
          <input
            ref={inputRef}
            type="url"
            autoFocus
            onBlur={salvar}
            defaultValue={musicaUrl ?? ""}
            placeholder="Link da música"
            className="flex-1 bg-transparent text-texto outline-none placeholder:text-auxiliar/60"
          />
        ) : musicaUrl ? (
          <>
            <span className="flex-1 truncate text-auxiliar">
              {musicaNome || "Sua música"}
            </span>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="shrink-0 text-xs uppercase tracking-wide text-auxiliar underline underline-offset-4"
            >
              Trocar música
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-auxiliar underline underline-offset-4"
          >
            adicionar música
          </button>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: totalPassos }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < passo ? "bg-acento" : "bg-auxiliar/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
