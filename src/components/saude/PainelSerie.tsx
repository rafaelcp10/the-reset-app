"use client";

import { useMemo, useState } from "react";
import Grafico, { type Ponto } from "./Grafico";

/**
 * Um número grande mandado pela curva embaixo dele.
 *
 * Arrastar o dedo no gráfico troca o número e a data — é o que devolve o
 * histórico que a lista de dez pesagens em texto dava, sem as dez linhas.
 * Soltando, nada "volta ao normal": o ponto fica onde a pessoa deixou,
 * porque conferir uma medida de três meses atrás é motivo legítimo para
 * abrir a aba.
 *
 * O seletor de período só aparece quando existe período para selecionar.
 * Botão que não muda nada é ruído, e ruído é o que cansa a vista.
 *
 * Ele abre em "Tudo", e não no período mais curto como o Zepp faz. A
 * pergunta desta aba é "como eu comecei e como estou": abrir em três meses
 * esconderia exatamente o começo, que é metade da resposta.
 */

type Janela = { rotulo: string; dias: number | null };

const JANELAS: Janela[] = [
  { rotulo: "3 meses", dias: 90 },
  { rotulo: "1 ano", dias: 365 },
  { rotulo: "Tudo", dias: null },
];

/**
 * Como o número se escreve — declarado, e não passado como função: função
 * não atravessa de Server Component para Client Component, e a página que
 * monta este painel roda no servidor.
 *
 * "enxuto" é o peso: 85, não 85,0. "uma-casa" é o percentual, onde a casa
 * decimal é a informação.
 */
export type FormatoNumero = "enxuto" | "uma-casa";

function escrever(valor: number, formato: FormatoNumero): string {
  if (formato === "enxuto" && valor % 1 === 0) return String(valor);
  return valor.toFixed(1).replace(".", ",");
}

export default function PainelSerie({
  rotulo,
  unidade,
  pontos,
  formato,
  acento = true,
  descricao,
}: {
  rotulo: string;
  unidade: string;
  /** Do mais antigo para o mais recente. */
  pontos: Ponto[];
  formato: FormatoNumero;
  acento?: boolean;
  descricao: string;
}) {
  const diasDaSerie = useMemo(() => {
    if (pontos.length < 2) return 0;
    return diferencaEmDias(pontos[0].data, pontos[pontos.length - 1].data);
  }, [pontos]);

  const janelas = JANELAS.filter(
    (j) => j.dias === null || diasDaSerie > j.dias,
  );
  const mostrarJanelas = janelas.length > 1;

  const [janela, setJanela] = useState<number | null>(null);

  const visiveis = useMemo(() => {
    if (janela === null) return pontos;
    const fim = pontos[pontos.length - 1].data;
    const recortados = pontos.filter(
      (p) => diferencaEmDias(p.data, fim) <= janela,
    );
    // Um ponto só não desenha curva; nesse caso o recorte não serviu.
    return recortados.length >= 2 ? recortados : pontos;
  }, [pontos, janela]);

  const [escolhido, setEscolhido] = useState<number | null>(null);
  const indice =
    escolhido === null
      ? visiveis.length - 1
      : Math.min(escolhido, visiveis.length - 1);

  const atual = visiveis[indice];
  const primeiro = visiveis[0];
  const ehOUltimo = indice === visiveis.length - 1;

  const nota =
    visiveis.length < 2
      ? "Primeiro registro"
      : ehOUltimo
        ? variacao(primeiro.valor, atual.valor, unidade, primeiro.data)
        : porExtenso(atual.data);

  return (
    <div className="bloco flex flex-col gap-3 overflow-hidden px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <span className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar">
          {rotulo}
        </span>

        {mostrarJanelas && (
          <div className="flex gap-1">
            {janelas.map((j) => (
              <button
                key={j.rotulo}
                type="button"
                aria-pressed={janela === j.dias}
                onClick={() => {
                  setJanela(j.dias);
                  setEscolhido(null);
                }}
                className={`tipo-rotulo min-h-11 rounded-[8px] px-2.5 text-[12.5px] tracking-[.06em] transition-colors duration-200 ${
                  janela === j.dias
                    ? "bg-superficie3 text-texto"
                    : "text-auxiliar-fraco"
                }`}
              >
                {j.rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="flex items-baseline gap-1.5">
          <span className="text-[38px] leading-none tabular-nums text-texto">
            {escrever(atual.valor, formato)}
          </span>
          <span className="text-[18px] text-auxiliar">{unidade}</span>
        </span>
        <span className="text-[14.5px] leading-[1.5] text-auxiliar">
          {nota}
        </span>
      </div>

      {/* A curva sangra até a borda do bloco: ela é o chão do número, não um
          elemento ao lado dele. */}
      <div className="-mx-4 -mb-4 mt-1">
        <Grafico
          pontos={visiveis}
          selecionado={indice}
          aoSelecionar={setEscolhido}
          acento={acento}
          descricao={descricao}
        />
      </div>
    </div>
  );
}

/**
 * "−1,1 kg desde 25/11."
 *
 * Sem seta, sem percentual e sem cor: subir não é vitória nem derrota, e o
 * app não sabe o que a pessoa quer. O sinal é o de menos de verdade (−),
 * não o hífen, que ao lado de um número grande parece sujeira.
 *
 * A diferença entre dois percentuais é medida em pontos percentuais, não em
 * por cento: de 19,5% para 15,6% não são "3,9%", são 3,9 p.p. — "3,9%"
 * seria a variação relativa, que é outro número.
 */
function variacao(
  inicial: number,
  atual: number,
  unidade: string,
  data: string,
): string {
  const delta = atual - inicial;
  const quando = `${data.slice(8, 10)}/${data.slice(5, 7)}`;
  if (Math.abs(delta) < 0.05) return `Igual a ${quando}`;
  const numero = Math.abs(delta).toFixed(1).replace(".", ",");
  const medida = unidade === "%" ? "p.p." : unidade;
  return `${delta > 0 ? "+" : "−"}${numero} ${medida} desde ${quando}`;
}

function porExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(ano, mes - 1, dia, 12)));
}

function diferencaEmDias(de: string, ate: string): number {
  const [a1, m1, d1] = de.split("-").map(Number);
  const [a2, m2, d2] = ate.split("-").map(Number);
  return Math.round(
    (Date.UTC(a2, m2 - 1, d2) - Date.UTC(a1, m1 - 1, d1)) / 86_400_000,
  );
}
