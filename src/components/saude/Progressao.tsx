import Link from "next/link";
import { ChevronDown, TrendingUp } from "lucide-react";
import type { GrupoDeProgresso } from "@/lib/saude/evolucao";
import { ParValor } from "./Painel";
import Tracinho from "./Tracinho";

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
 * `<details>` do navegador, e não estado em React: abre e fecha sem
 * JavaScript, e teclado e leitor de tela já sabem usar.
 *
 * Dentro, cada exercício é um bloco próprio, uma superfície acima da
 * caixa — a mesma gramática do `LinhaDoPainel`. Sem âmbar: o acento da
 * Evolução são as curvas grandes lá em cima.
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
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 text-[19px] leading-[1.3] text-texto">
              {grupo.titulo}
            </span>
            <span className="flex shrink-0 items-center gap-3">
              <ParValor
                valor={String(grupo.itens.length)}
                rotulo={grupo.itens.length === 1 ? "exercício" : "exercícios"}
              />
              <ChevronDown
                className="h-5 w-5 text-auxiliar transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                strokeWidth={1.75}
                aria-hidden
              />
            </span>
          </summary>

          <div className="flex flex-col gap-2 px-3 pb-3">
            {grupo.itens.map((item) => (
              <Link
                key={item.movimentoId}
                href={`/saude/exercicios/${item.movimentoId}`}
                className="flex flex-col gap-1.5 rounded-[10px] bg-superficie3 px-3.5 py-3"
              >
                {/* O nome na linha de cima, com a largura inteira. Ao lado da
                    curva e dos números sobravam 110px, e "Remada curvada com
                    barra" virava "Remada curvada com…" — justamente a parte
                    que distingue um exercício do outro. */}
                <span className="text-[16.5px] leading-[1.3] text-texto">
                  {item.nome}
                </span>

                <span className="flex items-center justify-between gap-3">
                  <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco">
                    {item.treinos} {item.treinos === 1 ? "treino" : "treinos"}
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <Tracinho
                      valores={item.curva}
                      descricao={`${item.nome}: de ${kg(item.primeira)} a ${kg(item.ultima)} kg em ${item.treinos} treinos.`}
                    />
                    <span className="text-[16px] tabular-nums text-auxiliar">
                      {item.treinos > 1 && (
                        <>
                          {kg(item.primeira)}{" "}
                          <span className="text-auxiliar-fraco">→</span>{" "}
                        </>
                      )}
                      <span className="text-texto">{kg(item.ultima)} kg</span>
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
