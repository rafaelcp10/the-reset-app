import Link from "next/link";
import { ChevronDown, TrendingUp } from "lucide-react";
import type { GrupoDeProgresso } from "@/lib/saude/evolucao";
import { escreverPercentual } from "@/lib/saude/progresso";
import { ParValor } from "./Painel";
import LinhaDoTempo from "./LinhaDoTempo";

/** 60, não 60,00. */
function kg(valor: number): string {
  return valor % 1 === 0 ? String(valor) : valor.toFixed(1).replace(".", ",");
}

/**
 * A progressão, uma caixa por treino — Push, Pull, Legs, Full.
 *
 * **Tudo começa fechado, sempre.** Com quatro treinos de seis exercícios,
 * a lista aberta eram vinte e quatro linhas empilhadas, e a tela lia como
 * texto corrido. Fechada, ela é quatro caixas, e a pessoa abre a que veio
 * conferir. Não lembra o que ficou aberto da última vez, de propósito: a
 * tela se abre para uma pergunta nova.
 *
 * Na caixa fechada, quantos exercícios e quanto a carga variou, em média.
 * **A porcentagem foi pedido do Rafael** e revisa a regra antiga de "sem
 * percentual" nesta tela — o que continua valendo é o resto dela: sem cor
 * pela direção, sem seta, e queda escrita com o mesmo peso da subida.
 *
 * Aberta, cada exercício é um bloco próprio com o primeiro treino e os três
 * mais recentes, datados.
 *
 * `<details>` do navegador, e não estado em React: abre e fecha sem
 * JavaScript, e teclado e leitor de tela já sabem usar. Sem âmbar: o
 * acento da Evolução são as curvas grandes lá em cima.
 */
export default function Progressao({ grupos }: { grupos: GrupoDeProgresso[] }) {
  if (grupos.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2.5 px-1 text-auxiliar">
        <TrendingUp className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
        <span className="tipo-rotulo text-[13.5px] tracking-[.1em]">
          Progressão
        </span>
      </h2>

      {grupos.map((grupo) => (
        <details key={grupo.chave} className="group bloco overflow-hidden">
          {/* Título em cima e os números embaixo, e não tudo numa linha:
              "Fora da série atual" com quantidade, porcentagem e seta não
              cabe em 375px. */}
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-[19px] leading-[1.3] text-texto">
                {grupo.titulo}
              </span>
              <span className="flex flex-wrap gap-x-4 gap-y-0.5">
                <ParValor
                  valor={String(grupo.itens.length)}
                  rotulo={grupo.itens.length === 1 ? "exercício" : "exercícios"}
                />
                {grupo.variacaoMedia !== null && (
                  <ParValor
                    valor={escreverPercentual(grupo.variacaoMedia)}
                    rotulo="na carga"
                  />
                )}
              </span>
            </span>
            <ChevronDown
              className="h-5 w-5 shrink-0 text-auxiliar transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              strokeWidth={1.75}
              aria-hidden
            />
          </summary>

          <div className="flex flex-col gap-2 px-3 pb-3">
            {grupo.itens.map((item) => (
              <Link
                key={item.movimentoId}
                href={`/saude/exercicios/${item.movimentoId}`}
                className="flex flex-col gap-2.5 rounded-[10px] bg-superficie3 px-3.5 py-3"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-[16.5px] leading-[1.3] text-texto">
                    {item.nome}
                  </span>
                  <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco">
                    {item.treinos} {item.treinos === 1 ? "treino" : "treinos"}
                    {item.variacao !== null &&
                      ` · ${escreverPercentual(item.variacao)}`}
                  </span>
                </span>

                <LinhaDoTempo
                  pontos={item.pontos}
                  omitidos={item.omitidos}
                  descricao={`${item.nome}: de ${kg(item.primeira)} a ${kg(item.ultima)} kg em ${item.treinos} ${item.treinos === 1 ? "treino" : "treinos"}.`}
                />
              </Link>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
