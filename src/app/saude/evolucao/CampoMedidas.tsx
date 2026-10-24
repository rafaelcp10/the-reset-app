"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Ruler } from "lucide-react";
import { salvarAltura, salvarMedida, salvarSexo } from "@/lib/saude/acoes";
import { useEstadoSalvo } from "@/lib/ui/useEstadoSalvo";
import IndicadorSalvo from "@/components/IndicadorSalvo";
import type { Sexo } from "@/lib/saude/composicao";

type Campo = {
  id: string;
  rotulo: string;
  unidade: string;
  minimo: number;
  maximo: number;
  passo: string;
  /**
   * Quanto o número pode se afastar do registro mais próximo antes de o
   * app pedir confirmação, em fração. O peso de um adulto não muda 5% em
   * duas semanas; a fita varia mais, com a posição e a respiração.
   */
  foraDoComum: number;
};

/** O registro mais próximo do mesmo campo, em outra data. */
export type Referencia = {
  valor: number;
  data: string;
  /** Se ele veio antes ou depois da data que está sendo medida. */
  quando: "antes" | "depois";
};

const PESO: Campo = {
  id: "peso_kg",
  rotulo: "Peso",
  unidade: "kg",
  minimo: 25,
  maximo: 400,
  passo: "0.1",
  foraDoComum: 0.05,
};

const FITA: Campo[] = [
  {
    id: "pescoco_cm",
    rotulo: "Pescoço",
    unidade: "cm",
    minimo: 20,
    maximo: 80,
    passo: "0.5",
    foraDoComum: 0.1,
  },
  {
    id: "cintura_cm",
    rotulo: "Cintura",
    unidade: "cm",
    minimo: 40,
    maximo: 200,
    passo: "0.5",
    foraDoComum: 0.1,
  },
];

const QUADRIL: Campo = {
  id: "quadril_cm",
  rotulo: "Quadril",
  unidade: "cm",
  minimo: 50,
  maximo: 200,
  passo: "0.5",
  foraDoComum: 0.1,
};

/**
 * As medidas de um dia — hoje, ou um dia antigo sendo corrigido.
 *
 * Nenhum campo é obrigatório e nenhum depende do outro para ser salvo: quem
 * só quer pesar, pesa e vai embora. A fita é o que abre o percentual de
 * gordura, e por isso ela fica junta e com o link do tutorial ao lado — a
 * pergunta "onde exatamente eu meço a cintura?" aparece na primeira vez e
 * some para sempre depois.
 */
export default function CampoMedidas({
  data,
  sexo,
  altura,
  valores,
  referencias,
}: {
  data: string;
  sexo: Sexo | null;
  altura: number | null;
  valores: Record<string, number | null>;
  referencias: Record<string, Referencia | null>;
}) {
  const daFita = sexo === "feminino" ? [...FITA, QUADRIL] : FITA;

  return (
    <div className="bloco flex flex-col gap-5 px-4 py-4">
      <div className="flex flex-col gap-4">
        <Numero
          campo={PESO}
          data={data}
          inicial={valores[PESO.id] ?? null}
          referencia={referencias[PESO.id] ?? null}
        />
      </div>

      <div className="flex flex-col gap-4 border-t border-filete pt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
            Com a fita
          </h2>
          <Link
            href="/saude/evolucao/medir"
            className="inline-flex min-h-11 items-center gap-1.5 text-[15.5px] text-auxiliar"
          >
            <Ruler className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Como medir
          </Link>
        </div>

        {sexo === null ? (
          <EscolhaSexo />
        ) : (
          <>
            {altura === null && <CampoAltura />}
            {daFita.map((campo) => (
              <Numero
                key={campo.id}
                campo={campo}
                data={data}
                inicial={valores[campo.id] ?? null}
                referencia={referencias[campo.id] ?? null}
              />
            ))}
          </>
        )}
      </div>

      <p className="text-[15.5px] leading-[1.6] text-auxiliar">
        Uma semana sem medir não é um buraco.
      </p>
    </div>
  );
}

/** 77,6, e não 77.6; 92, e não 92,0. */
function escrito(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}

function porExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(ano, mes - 1, dia, 12)));
}

/**
 * Um número, salvo ao sair do campo — e conferido antes, quando parece
 * erro de digitação.
 *
 * Um 77,6 digitado no lugar do peso certo em 19/10/2026 mudou a água de 5
 * para 4 garrafas e as calorias de todos os dias seguintes, e ninguém
 * percebeu por uma semana. Agora, número longe do registro mais próximo
 * não é gravado na hora: a tela mostra os dois lado a lado e pergunta.
 * "Está certo" grava; "Corrigir" devolve o cursor ao campo.
 *
 * Só pergunta; nunca recusa. Perder 5 kg num mês acontece, e quem
 * emagreceu de verdade não pode ser tratado como quem errou a tecla.
 */
function Numero({
  campo,
  data,
  inicial,
  referencia,
}: {
  campo: Campo;
  data: string;
  inicial: number | null;
  referencia: Referencia | null;
}) {
  const [estadoSalvo, executar] = useEstadoSalvo();
  // Guardado como texto: `Number("")` é zero, e o campo vazio virava 0 na
  // tela assim que a pessoa apagava para redigitar.
  const [valor, setValor] = useState(
    inicial !== null ? String(inicial) : "",
  );
  // O número esperando confirmação, quando ele parece fora do comum.
  const [conferindo, setConferindo] = useState<number | null>(null);
  const campoRef = useRef<HTMLInputElement>(null);

  function salvar() {
    setConferindo(null);
    executar(salvarMedida(data, campo.id, valor));
  }

  function aoSair() {
    const limpo = valor.replace(",", ".").trim();
    // Apagar não precisa de confirmação: é tirar um valor, não pôr um novo.
    if (limpo === "") return salvar();
    const n = Number(limpo);
    if (!Number.isFinite(n)) return;
    // Saiu do campo sem mudar nada: nem pergunta, nem grava de novo.
    if (inicial !== null && n === Number(inicial)) return setConferindo(null);
    if (
      referencia &&
      referencia.valor > 0 &&
      Math.abs(n - referencia.valor) / referencia.valor > campo.foraDoComum
    ) {
      return setConferindo(n);
    }
    salvar();
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <span className="text-[16.5px] text-texto">{campo.rotulo}</span>
          <IndicadorSalvo estado={estadoSalvo} />
        </span>

        <span className="flex shrink-0 items-baseline gap-2">
          <input
            ref={campoRef}
            type="number"
            inputMode="decimal"
            step={campo.passo}
            min={campo.minimo}
            max={campo.maximo}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={aoSair}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            enterKeyHint="done"
            placeholder="—"
            className="w-[88px] border-b border-filete-media bg-transparent py-1.5 text-right text-[21px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
          />
          <span className="w-6 text-[15.5px] text-auxiliar">
            {campo.unidade}
          </span>
        </span>
      </label>

      {conferindo !== null && referencia && (
        // Sem vermelho e sem ícone de alerta: é uma pergunta, não um erro.
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-[10px] bg-superficie3 px-3.5 py-3"
        >
          <p className="text-[16px] leading-[1.5] text-texto">
            {escrito(conferindo)} {campo.unidade}?{" "}
            <span className="text-auxiliar">
              {referencia.quando === "antes"
                ? `Da última vez foram ${escrito(referencia.valor)} ${campo.unidade}, em ${porExtenso(referencia.data)}.`
                : `Na medida seguinte, em ${porExtenso(referencia.data)}, foram ${escrito(referencia.valor)} ${campo.unidade}.`}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={salvar}
              className="pilula tipo-rotulo min-h-11 flex-1 rounded-[8px] px-3 text-[14px] tracking-[.06em] text-texto"
            >
              Está certo
            </button>
            <button
              type="button"
              onClick={() => {
                setConferindo(null);
                campoRef.current?.focus();
                campoRef.current?.select();
              }}
              className="pilula tipo-rotulo min-h-11 flex-1 rounded-[8px] px-3 text-[14px] tracking-[.06em] text-texto"
            >
              Corrigir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A fórmula tem dois ramos, e eles não dão o mesmo número — não existe
 * padrão razoável para chutar. A pergunta aparece aqui, no momento em que
 * ela serve para alguma coisa, e não no onboarding: quem nunca abriu a
 * Evolução nunca precisa responder.
 */
function EscolhaSexo() {
  const [enviando, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[16px] leading-[1.6] text-auxiliar">
        A conta de gordura pela fita tem duas versões. Qual delas usar?
      </p>
      <div className="flex gap-2">
        {(["masculino", "feminino"] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            disabled={enviando}
            onClick={() => iniciar(() => void salvarSexo(valor))}
            className="tipo-rotulo min-h-11 flex-1 rounded-[10px] bg-superficie3 px-3 text-[14px] tracking-[.09em] text-texto"
          >
            {valor === "masculino" ? "Masculina" : "Feminina"}
          </button>
        ))}
      </div>
      <p className="text-[15px] leading-[1.6] text-auxiliar-fraco">
        Usado só nesta conta. Não aparece em nenhuma outra tela.
      </p>
    </div>
  );
}

/** A altura mora no perfil. Só é perguntada aqui quando lá está vazia. */
function CampoAltura() {
  const [valor, setValor] = useState("");
  const [enviando, iniciar] = useTransition();

  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-[16.5px] text-texto">Altura</span>
      <span className="flex shrink-0 items-baseline gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={100}
          max={250}
          value={valor}
          disabled={enviando}
          onChange={(e) => setValor(e.target.value)}
          onBlur={() => iniciar(() => void salvarAltura(valor))}
          placeholder="—"
          className="w-[88px] border-b border-filete-media bg-transparent py-1.5 text-right text-[21px] text-texto outline-none transition-colors duration-200 placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
        />
        <span className="w-6 text-[15.5px] text-auxiliar">cm</span>
      </span>
    </label>
  );
}
