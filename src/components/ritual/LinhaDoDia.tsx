"use client";

import { useRef, useState } from "react";
import { Check } from "lucide-react";
import {
  confirmarDia,
  salvarIntencaoAmanha,
  salvarLinhaHoje,
} from "@/lib/ritual/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";
import MarcaFeito from "@/components/MarcaFeito";

/**
 * A linha de hoje, e o fechamento dela.
 *
 * Antes esta seção tinha duas versões, escolhidas pelo horário: de dia um
 * campo para escrever, de noite os botões para marcar. Quem terminasse às
 * seis da tarde não tinha onde dizer que fez — o botão só nascia às 21:30.
 *
 * Agora quem decide o que aparece é o estado da linha, não o relógio. Sem
 * linha, o campo. Com linha, os dois botões, e a linha continua editável
 * ao lado. O horário de check-in volta a ser o que sempre devia ter sido:
 * a hora do lembrete, não uma tranca.
 *
 * "E amanhã" continua só à noite: é a última coisa do dia, e pedir isso às
 * dez da manhã seria pedir para a pessoa planejar o amanhã antes de viver
 * o hoje.
 */
export default function LinhaDoDia({
  modo,
  linhaHoje,
  linhaOntem,
  feitoOntem,
  feitoHoje,
  dataHoje,
  caminhoAtual,
  focoInicial = false,
  intencaoAmanha = null,
}: {
  /** Só decide se "E amanhã" aparece. A linha em si não depende da hora. */
  modo: "manha" | "noite";
  linhaHoje: string | null;
  linhaOntem: string | null;
  feitoOntem: boolean | null;
  feitoHoje: boolean | null;
  dataHoje: string;
  caminhoAtual: string;
  focoInicial?: boolean;
  /** O que a pessoa disse ontem à noite que faria hoje. */
  intencaoAmanha?: string | null;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();
  const temLinha = Boolean(linhaHoje?.trim());
  // Sem linha escrita, o campo é o único caminho e já nasce aberto.
  const [editando, setEditando] = useState(!temLinha || focoInicial);

  function salvarLinha() {
    const fd = new FormData();
    fd.set("linha", textareaRef.current?.value ?? "");
    executar(salvarLinhaHoje(caminhoAtual, dataHoje, fd));
  }

  return (
    <section id="linha-do-dia" className="bloco flex flex-col gap-3 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="tipo-rotulo text-[16px] tracking-[.1em] text-acento-claro">
          A linha de hoje
        </h2>
        <IndicadorSalvo estado={estadoSalvo} />
      </div>

      {editando ? (
        <textarea
          ref={textareaRef}
          defaultValue={linhaHoje ?? ""}
          onBlur={() => {
            salvarLinha();
            if (textareaRef.current?.value.trim()) setEditando(false);
          }}
          autoFocus={focoInicial || (temLinha && editando)}
          placeholder="o que eu vou fazer hoje"
          rows={2}
          className="resize-none border-b border-filete-media bg-transparent px-2 py-1.5 text-[17px] leading-[1.6] text-texto outline-none placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
        />
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <p className="flex-1 text-[17px] leading-[1.6] text-texto">
            {linhaHoje}
          </p>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="shrink-0 text-[15.5px] text-auxiliar underline underline-offset-4"
          >
            editar
          </button>
        </div>
      )}

      {/* Marcar só faz sentido com algo escrito para marcar. */}
      {temLinha && !editando && (
        <div className="flex gap-3">
          <form
            action={confirmarDia.bind(null, caminhoAtual, dataHoje, true)}
            className="flex-1"
          >
            <button
              type="submit"
              className={`tipo-rotulo flex w-full items-center justify-center gap-2 rounded-[10px] py-3.5 text-center text-[16px] tracking-[.09em] transition-colors duration-[250ms] ${
                feitoHoje === true
                  ? "bg-acento text-fundo"
                  : "bg-superficie2 text-texto"
              }`}
            >
              {feitoHoje === true && (
                <Check className="h-[18px] w-[18px]" strokeWidth={2.5} />
              )}
              Fiz
            </button>
          </form>
          <form
            action={confirmarDia.bind(null, caminhoAtual, dataHoje, false)}
            className="flex-1"
          >
            {/* "Não fiz" não é erro: mesma forma, mesmo peso, sem vermelho
                e sem encolher. Falhar não zera nada. */}
            <button
              type="submit"
              className={`tipo-rotulo w-full rounded-[10px] py-3.5 text-center text-[16px] tracking-[.09em] transition-colors duration-[250ms] ${
                feitoHoje === false
                  ? "bg-superficie3 text-texto"
                  : "bg-superficie2 text-texto"
              }`}
            >
              Não fiz
            </button>
          </form>
        </div>
      )}

      {feitoOntem !== null && (
        <div className="flex flex-col gap-1">
          <MarcaFeito
            feito={feitoOntem}
            rotulo="ontem"
            texto={{ sim: "Feita", nao: "Não feita" }}
          />
          {linhaOntem && (
            <p className="text-[16px] leading-[1.5] text-auxiliar">
              {linhaOntem}
            </p>
          )}
        </div>
      )}

      {modo === "noite" && (
        <CampoAmanha
          dataHoje={dataHoje}
          caminhoAtual={caminhoAtual}
          valorInicial={intencaoAmanha}
        />
      )}
    </section>
  );
}

/**
 * A ponte para a manhã seguinte. Fica no fim do check-in, depois do fiz /
 * não fiz, porque é a última coisa da noite — e é opcional: quem não
 * quiser pensar em amanhã fecha o dia sem ela.
 */
function CampoAmanha({
  dataHoje,
  caminhoAtual,
  valorInicial,
}: {
  dataHoje: string;
  caminhoAtual: string;
  valorInicial: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [estadoSalvo, executar] = useEstadoSalvo();

  function salvar() {
    const fd = new FormData();
    fd.set("amanha", inputRef.current?.value ?? "");
    executar(salvarIntencaoAmanha(caminhoAtual, dataHoje, fd));
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
          E amanhã
        </h3>
        <IndicadorSalvo estado={estadoSalvo} />
      </div>
      <input
        ref={inputRef}
        type="text"
        defaultValue={valorInicial ?? ""}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
        enterKeyHint="done"
        placeholder="se já souber, deixa dito"
        className="w-full border-b border-filete-media bg-transparent px-2 py-1.5 text-[16.5px] leading-[1.6] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
      />
    </div>
  );
}
