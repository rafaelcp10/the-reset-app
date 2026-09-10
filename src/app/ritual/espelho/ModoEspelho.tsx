"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Mic, Music, Play, Square } from "lucide-react";
import { salvarPreferenciasRitual } from "@/lib/ritual/acoes";
import EscolhaDoDia from "./EscolhaDoDia";
import { GuiaRespiracao, lerGuia } from "@/lib/ui/sensorial";

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
/** Respiro entre uma repetição e a seguinte, para não emendar. */
const PAUSA_ENTRE_VOLTAS_MS = 1200;

export default function ModoEspelho({
  frases,
  musicaUrl,
  musicaNome,
  repeticoesIniciais,
  maosLivresInicial,
  dataHoje,
  tarefasDeHoje,
  ditoOntem,
  temGravacao,
}: {
  frases: ItemFrase[];
  musicaUrl: string | null;
  musicaNome: string | null;
  repeticoesIniciais: number;
  maosLivresInicial: boolean;
  dataHoje: string;
  /** O que já está no dia — vira a escolha da linha no fim do ritual. */
  tarefasDeHoje: string[];
  /** O que a pessoa disse ontem à noite que faria hoje. */
  ditoOntem: string | null;
  /** Habilita o caminho de ouvir em vez de ler. */
  temGravacao: boolean;
}) {
  // passos: 0 = respiração, 1..N = frases, N+1 = eco, N+2 = escolha da linha
  const passoEco = frases.length + 1;
  const passoEscolha = frases.length + 2;
  const [passo, setPasso] = useState(0);
  // Ouvir é um modo do mesmo ritual, não outro ritual: mesmos passos,
  // mesmo eco, mesma decisão do dia no fim, mesma marcação de feito.
  const [modoAudio, setModoAudio] = useState(false);
  // A respiração acontece inteira antes de qualquer decisão.
  const [escolhendoModo, setEscolhendoModo] = useState(false);

  const repeticoes = OPCOES_REPETICOES.includes(
    repeticoesIniciais as (typeof OPCOES_REPETICOES)[number],
  )
    ? repeticoesIniciais
    : 3;
  // Muda na própria tela de escolha e fica guardado na conta: quem achou
  // o automático no meio do ritual não deveria ter que ir a Ajustes para
  // mantê-lo amanhã.
  const [maosLivres, setMaosLivres] = useState(maosLivresInicial);

  function trocarAvanco(automatico: boolean) {
    setMaosLivres(automatico);
    salvarPreferenciasRitual(repeticoes, automatico);
  }

  const audioRef = useRef<HTMLAudioElement>(null);

  const avancar = useCallback(() => {
    setPasso((p) => Math.min(p + 1, passoEco));
  }, [passoEco]);

  useEffect(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    // No modo de escuta a música é cama para a voz, não concorrente.
    if (audioRef.current) audioRef.current.volume = modoAudio ? 0.3 : 1;
  }, [modoAudio]);

  useEffect(() => {
    if (passo === 0 && maosLivres && !escolhendoModo) {
      const t = setTimeout(
        () => setEscolhendoModo(true),
        DURACAO_RESPIRACAO_AUTOMATICA_MS,
      );
      return () => clearTimeout(t);
    }
    // O tempo das frases é contado dentro de TelaFrase: lá ele também move
    // o contador de leituras na tela. Dois relógios para a mesma espera
    // saíam de sincronia e a barra terminava antes ou depois da virada.
    if (passo === passoEco) {
      // O ritual sempre termina decidindo o dia — mesmo com o backlog
      // vazio, que antes fazia o passo ser pulado em silêncio. Ler as
      // frases e sair sem escolher nada deixa a manhã sem consequência,
      // que é justamente o contrário do que o Espelho existe para fazer.
      const t = setTimeout(() => setPasso(passoEscolha), DURACAO_ECO_MS);
      return () => clearTimeout(t);
    }
  }, [passo, maosLivres, passoEco, passoEscolha, escolhendoModo]);

  function aoTocarNaTela() {
    // A abertura (respiração e escolha) não avança por toque: lá o toque
    // serve para destravar o áudio no iPhone, e avançar junto matava o som.
    if (passo >= 1 && passo <= frases.length) avancar();
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
          escolhendoModo ? (
            <EscolhaModo
              temGravacao={temGravacao}
              maosLivres={maosLivres}
              aoTrocarAvanco={trocarAvanco}
              aoLer={() => avancar()}
              aoOuvir={() => {
                setModoAudio(true);
                avancar();
              }}
            />
          ) : (
            <TelaRespiracao
              automatico={maosLivres}
              aoConcluir={() => setEscolhendoModo(true)}
            />
          )
        ) : passo <= frases.length ? (
          <TelaFrase
            key={passo}
            item={frases[passo - 1]}
            indice={passo}
            total={frases.length}
            repeticoes={repeticoes}
            maosLivres={maosLivres}
            modoAudio={modoAudio}
            aoConcluirFrase={avancar}
          />
        ) : passo === passoEco ? (
          <TelaEco palavra={palavraEco} />
        ) : (
          <EscolhaDoDia
            tarefas={tarefasDeHoje}
            ditoOntem={ditoOntem}
            dataHoje={dataHoje}
          />
        )}
      </div>

      {mostrandoRodape && (
        <Rodape musicaUrl={musicaUrl} musicaNome={musicaNome} />
      )}
    </div>
  );
}

/**
 * A decisão vem depois da respiração, não durante. Assim ninguém precisa
 * escolher no meio de um exercício que acabou de fazer — e o toque na
 * respiração fica livre para destravar o áudio.
 */
function EscolhaModo({
  temGravacao,
  maosLivres,
  aoTrocarAvanco,
  aoLer,
  aoOuvir,
}: {
  temGravacao: boolean;
  maosLivres: boolean;
  aoTrocarAvanco: (automatico: boolean) => void;
  aoLer: () => void;
  aoOuvir: () => void;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="entrada-frase flex flex-1 flex-col justify-center gap-8 px-6 py-8"
    >
      <div className="flex flex-col gap-2">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar">
          As cinco frases
        </span>
        <h1 className="text-[26px] leading-[1.3] text-texto">Como hoje?</h1>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={aoLer}
          className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Ler em voz alta
        </button>

        {temGravacao ? (
          <button
            type="button"
            onClick={aoOuvir}
            className="pilula tipo-rotulo w-full rounded-[10px] py-4 text-center text-[14px] tracking-[.09em] text-texto"
          >
            Ouvir na minha voz
          </button>
        ) : (
          <p className="text-[13px] leading-[1.6] text-auxiliar-fraco">
            Grave sua voz em alguma frase e ela também poderá tocar aqui.
          </p>
        )}
      </div>

      {/* O automático morava só em Ajustes, onde ninguém o encontrava no
          momento em que ele importa. A pergunta é a mesma — como hoje —
          então a resposta fica aqui. */}
      <div className="flex flex-col gap-3">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar-fraco">
          A frase passa
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => aoTrocarAvanco(false)}
            className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3 text-center text-[12px] tracking-[.09em] text-texto ${
              !maosLivres ? "pilula-ativa" : ""
            }`}
          >
            Quando eu tocar
          </button>
          <button
            type="button"
            onClick={() => aoTrocarAvanco(true)}
            className={`pilula tipo-rotulo flex-1 rounded-[8px] py-3 text-center text-[12px] tracking-[.09em] text-texto ${
              maosLivres ? "pilula-ativa" : ""
            }`}
          >
            Sozinha
          </button>
        </div>
      </div>
    </div>
  );
}

function TelaRespiracao({
  automatico,
  aoConcluir,
}: {
  automatico: boolean;
  aoConcluir: () => void;
}) {
  const [precisaToque, setPrecisaToque] = useState(false);

  // O guia sensorial é escolhido por aparelho, em Ajustes. Silencioso é o
  // padrão: som só começa quando a pessoa pediu.
  useEffect(() => {
    const modo = lerGuia();
    const guia = new GuiaRespiracao(modo);
    guia.iniciar();
    // No iPhone o áudio fica travado até um toque. Antes o toque avançava a
    // tela, então o som morria no instante em que ia começar; agora a tela
    // fica parada e o toque só destrava.
    if (modo === "som") {
      // Confere depois de um instante: destravar o contexto é assíncrono, e
      // perguntar agora daria falso negativo em navegador que permite.
      const conferir = setTimeout(() => setPrecisaToque(!guia.tocando()), 600);
      return () => {
        clearTimeout(conferir);
        guia.parar();
      };
    }
    return () => guia.parar();
  }, []);

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-[26px] leading-[1.3] text-texto">
          Respire dez vezes
        </h1>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          {precisaToque
            ? "Puxe o ar pelo nariz e solte fundo pela boca. Toque uma vez na tela para o som começar."
            : "Puxe o ar pelo nariz e solte fundo pela boca. Os pontos marcam o ritmo — não precisa tocar em nada."}
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

      {/* A escolha do modo não fica aqui: a respiração é um momento
          próprio, e decidir no meio dela custa a respiração já feita. */}
      <div className="flex flex-col gap-4">
        {automatico && (
          <BarraTempo duracaoMs={DURACAO_RESPIRACAO_AUTOMATICA_MS} />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            aoConcluir();
          }}
          className="botao-acento tipo-rotulo w-full rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Respirei
        </button>
      </div>
    </div>
  );
}

function TelaFrase({
  item,
  indice,
  total,
  repeticoes,
  maosLivres,
  modoAudio,
  aoConcluirFrase,
}: {
  item: ItemFrase;
  indice: number;
  total: number;
  repeticoes: number;
  maosLivres: boolean;
  modoAudio: boolean;
  aoConcluirFrase: () => void;
}) {
  // No modo de escuta a frase toca o mesmo número de vezes que seria lida,
  // e só então o ritual segue. Sem gravação para esta frase, o tempo faz o
  // papel do áudio — ninguém fica preso numa tela muda.
  const [volta, setVolta] = useState(1);
  const vozRef = useRef<HTMLAudioElement>(null);
  const porGravacao = modoAudio && Boolean(item.urlGravacao);
  /** O tempo conduz: automático lendo em voz alta, ou escuta sem gravação. */
  const porTempo = (maosLivres || modoAudio) && !porGravacao;

  useEffect(() => {
    if (porGravacao) {
      vozRef.current?.play().catch(() => aoConcluirFrase());
      return;
    }
    if (!porTempo) return;

    // Uma volta por vez, em vez de um único tempo no fim: assim o número de
    // leituras anda na tela e a espera deixa de parecer travamento — foi
    // exatamente por parecer travada que o automático foi dado como quebrado.
    let atual = 1;
    const relogio = setInterval(() => {
      atual += 1;
      if (atual > repeticoes) {
        clearInterval(relogio);
        aoConcluirFrase();
        return;
      }
      setVolta(atual);
    }, TEMPO_POR_REPETICAO_MS);
    return () => clearInterval(relogio);
    // Roda uma vez por frase: TelaFrase é remontada a cada passo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aoTerminarVoz() {
    if (volta >= repeticoes) {
      aoConcluirFrase();
      return;
    }
    setVolta((v) => v + 1);
    const audio = vozRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setTimeout(() => audio.play().catch(() => aoConcluirFrase()), PAUSA_ENTRE_VOLTAS_MS);
  }

  return (
    <div className="entrada-frase flex flex-1 flex-col justify-between px-6 py-8">
      <div className="flex flex-col gap-2">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar">
          {item.rotulo} · frase {indice} de {total}
        </span>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          {modoAudio
            ? `Na sua voz · ${volta} de ${repeticoes}`
            : maosLivres
              ? `Leia em voz alta · ${volta} de ${repeticoes}`
              : `Leia em voz alta ${repeticoes} ${repeticoes === 1 ? "vez" : "vezes"}. Um toque segue para a próxima.`}
        </p>
      </div>

      <p className="text-[29px] leading-[1.5] text-texto">
        {formatarTexto(item.texto, item.palavraEscolhida)}
      </p>

      {modoAudio && item.urlGravacao && (
        <audio ref={vozRef} src={item.urlGravacao} onEnded={aoTerminarVoz} preload="auto" />
      )}

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
        {porTempo && (
          <BarraTempo chave={volta} duracaoMs={TEMPO_POR_REPETICAO_MS} />
        )}

        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {Array.from({ length: repeticoes }).map((_, i) => (
              <span
                key={i}
                className={`h-[2px] w-4 transition-colors duration-500 ${
                  i < volta ? "bg-texto" : "bg-auxiliar-minimo"
                }`}
              />
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
 * Quanto falta desta espera. Existe só no automático: quando é a pessoa
 * que toca para avançar, não há tempo a mostrar. Cinza, nunca âmbar — o
 * acento da tela já é a palavra escolhida na frase.
 */
function BarraTempo({
  duracaoMs,
  chave,
}: {
  duracaoMs: number;
  /** Muda a cada volta para a animação recomeçar do zero. */
  chave?: number;
}) {
  return (
    <div className="h-[2px] w-full overflow-hidden rounded-full bg-superficie2">
      <span
        key={chave}
        className="preencher-tempo block h-full w-full bg-auxiliar"
        style={{ "--duracao": `${duracaoMs}ms` } as CSSProperties}
      />
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
