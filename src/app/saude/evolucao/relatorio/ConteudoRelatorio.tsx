import Link from "next/link";
import { Camera, ChevronLeft, ChevronRight, Dumbbell, Lightbulb, Layers, CalendarRange, Ruler } from "lucide-react";
import { mesAnterior, type Relatorio } from "@/lib/saude/relatorio";
import { escreverPercentual } from "@/lib/saude/progresso";
import { kg } from "@/lib/saude/serie";
import {
  dataCurta,
  diferencaDoCorpo,
  horas,
  milhar,
  nomeDoMes,
  proximoMes,
  valorDoCorpo,
} from "@/lib/saude/relatorioTexto";
import Painel from "@/components/saude/Painel";
import Revelar from "@/components/movimento/Revelar";
import BaixarPdf from "./BaixarPdf";

/** O relatório pronto na tela — separado da busca para poder ser visto sem login nos testes. */
export default function ConteudoRelatorio({ r, atual }: { r: Relatorio; atual: string }) {
  const mes = r.mes;
  const temTreino = r.resumo.treinos > 0 || r.porTreino.length > 0;
  // Mês sem treino mas com medida ou foto ainda tem o que mostrar.
  const vazio = !temTreino && r.corpo.length === 0 && r.fotos.length === 0;
  const nomeAnterior = nomeDoMes(mesAnterior(mes), false);
  const maiorGrupo = Math.max(1, ...r.grupos.map((g) => g.series));

  return (
    <div className="flex grow flex-col gap-5 px-5 pb-10 pt-6">
      <Link
        href="/saude/evolucao"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={14} desfoque={4} className="flex flex-col gap-3 px-1">
        <h1 className="text-[26px] leading-tight text-texto">Relatório</h1>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/saude/evolucao/relatorio?mes=${mesAnterior(mes)}`}
            aria-label={`Relatório de ${nomeDoMes(mesAnterior(mes))}`}
            className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center text-auxiliar"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <span className="text-[17px] text-texto">
            {r.parcial ? `${nomeDoMes(mes, false)}, até agora` : nomeDoMes(mes)}
          </span>
          {mes < atual ? (
            <Link
              href={`/saude/evolucao/relatorio?mes=${proximoMes(mes)}`}
              aria-label={`Relatório de ${nomeDoMes(proximoMes(mes))}`}
              className="-m-2 inline-flex min-h-11 min-w-11 items-center justify-center text-auxiliar"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </Link>
          ) : (
            <span className="min-w-11" aria-hidden />
          )}
        </div>
      </Revelar>

      {vazio ? (
        <p className="px-1 text-[16.5px] leading-[1.6] text-auxiliar">
          Nada registrado neste mês: nem treino, nem medida, nem foto.
        </p>
      ) : (
        <>
          {temTreino && (
          <Revelar imediato atraso={60}>
            <Painel icone={CalendarRange} rotulo="Os treinos">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Numero valor={String(r.resumo.treinos)} rotulo={r.resumo.treinos === 1 ? "treino" : "treinos"} antes={r.anterior && String(r.anterior.treinos)} mesAntes={nomeAnterior} />
                <Numero valor={String(r.resumo.semanas)} rotulo={r.resumo.semanas === 1 ? "semana com treino" : "semanas com treino"} antes={r.anterior && String(r.anterior.semanas)} mesAntes={nomeAnterior} />
                <Numero valor={horas(r.resumo.minutos)} rotulo="de treino" antes={r.anterior && horas(r.anterior.minutos)} mesAntes={nomeAnterior} />
                <Numero valor={milhar(r.resumo.series)} rotulo="séries" antes={r.anterior && milhar(r.anterior.series)} mesAntes={nomeAnterior} />
                <Numero valor={`${milhar(r.resumo.volume)} kg`} rotulo="de volume" antes={r.anterior && `${milhar(r.anterior.volume)} kg`} mesAntes={nomeAnterior} largo />
              </div>
            </Painel>
          </Revelar>
          )}

          {r.corpo.length > 0 && (
            <Revelar imediato atraso={90}>
              <Painel icone={Ruler} rotulo="O corpo">
                {/* O último valor do mês, quanto mudou dentro dele, e quanto
                    desde a primeira medida. Sem cor e sem seta: subir ou
                    descer não é vitória nem derrota, e o app não sabe o que
                    a pessoa quer. */}
                <div className="flex flex-col gap-2">
                  {r.corpo.map((c) => (
                    <div
                      key={c.chave}
                      className="flex items-center justify-between gap-3 rounded-[10px] bg-superficie3 px-3.5 py-3"
                    >
                      <span className="flex flex-col">
                        <span className="text-[15.5px] text-auxiliar">{c.rotulo}</span>
                        <span className="text-[22px] leading-tight tabular-nums text-texto">
                          {valorDoCorpo(c.valor, c.unidade)}
                        </span>
                      </span>
                      <span className="flex flex-col items-end text-right text-[14.5px] tabular-nums text-auxiliar">
                        {c.noMes !== null && <span>{diferencaDoCorpo(c.noMes, c.unidade)} no mês</span>}
                        {c.desdeOComeco !== null && c.dataDoComeco && (
                          <span className="text-auxiliar-fraco">
                            {diferencaDoCorpo(c.desdeOComeco, c.unidade)} desde {dataCurta(c.dataDoComeco)}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </Painel>
            </Revelar>
          )}

          {r.fotos.length > 0 && (
            <Revelar imediato atraso={120}>
              <Painel icone={Camera} rotulo="Antes e depois">
                {/* A primeira foto de cada ângulo, fixa, ao lado da mais
                    recente deste mês. `<img>` comum, e nunca o otimizador
                    do Next: ele guardaria foto de corpo num cache que não é
                    da pessoa. */}
                <div className="flex flex-col gap-4">
                  {r.fotos.map((par) => (
                    <div key={par.angulo} className="flex flex-col gap-2">
                      <span className="text-[15.5px] text-texto">{par.rotulo}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[par.antes, par.depois].map((foto, i) =>
                          foto ? (
                            <figure key={i} className="flex flex-col gap-1">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={foto.url ?? undefined}
                                alt={`${par.rotulo}, ${dataCurta(foto.data)}`}
                                className="aspect-[3/4] w-full rounded-[10px] bg-superficie3 object-cover"
                              />
                              <figcaption className="text-[13.5px] text-auxiliar-fraco">
                                {i === 0 ? "Primeira" : "Este mês"} · {dataCurta(foto.data)}
                              </figcaption>
                            </figure>
                          ) : (
                            <div
                              key={i}
                              className="flex aspect-[3/4] items-center justify-center rounded-[10px] bg-superficie3 px-3 text-center text-[14px] text-auxiliar-fraco"
                            >
                              A primeira foto é deste mês: é o começo.
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Painel>
            </Revelar>
          )}

          {r.dicas.length > 0 && (
            <Revelar imediato atraso={120}>
              <Painel icone={Lightbulb} rotulo="Dicas">
                <div className="flex flex-col gap-2">
                  {r.dicas.map((d) => (
                    <Link
                      key={`${d.tipo}-${d.movimentoId}`}
                      href={`/saude/exercicios/${d.movimentoId}`}
                      className="flex flex-col gap-1.5 rounded-[10px] bg-superficie3 px-3.5 py-3"
                    >
                      <span className="text-[16px] leading-[1.45] text-texto">{d.observacao}</span>
                      <span className="text-[15.5px] leading-[1.5] text-auxiliar">{d.sugestao}</span>
                    </Link>
                  ))}
                </div>
                <p className="text-[14.5px] leading-[1.5] text-auxiliar-fraco">
                  Convenções de academia, não regras. O seu corpo, e quem
                  acompanha o seu treino, sabem mais.
                </p>
              </Painel>
            </Revelar>
          )}

          {r.porTreino.length > 0 && (
          <Revelar atraso={40}>
            <Painel icone={Dumbbell} rotulo="Por treino">
              <div className="flex flex-col gap-4">
                {r.porTreino.map((t) => (
                  <div key={t.titulo} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[18px] text-texto">{t.titulo}</span>
                      {t.variacaoMedia !== null && (
                        <span className="text-[15.5px] tabular-nums text-auxiliar">
                          {escreverPercentual(t.variacaoMedia)} na carga
                        </span>
                      )}
                    </div>
                    {t.itens.map((i) => (
                      <Link
                        key={i.movimentoId}
                        href={`/saude/exercicios/${i.movimentoId}`}
                        className="flex min-h-11 items-center justify-between gap-3 rounded-[10px] bg-superficie3 px-3.5 py-2"
                      >
                        <span className="min-w-0 text-[15.5px] leading-[1.35] text-texto">{i.nome}</span>
                        <span className="shrink-0 text-right text-[15px] tabular-nums text-auxiliar">
                          {i.primeira !== i.ultima ? `${kg(i.primeira)} → ${kg(i.ultima)} kg` : `${kg(i.ultima)} kg`}
                          {i.variacao !== null && (
                            <span className="block text-[13.5px] text-auxiliar-fraco">
                              {escreverPercentual(i.variacao)} · {i.sessoes} treinos
                            </span>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </Painel>
          </Revelar>
          )}

          {r.grupos.length > 0 && (
            <Revelar atraso={60}>
              <Painel icone={Layers} rotulo="Séries por grupo">
                {/* Relativas umas às outras, e nada mais: sem "pouco" nem
                    "muito", sem faixa recomendada. */}
                <div className="flex flex-col gap-2.5">
                  {r.grupos.map((g) => (
                    <div key={g.rotulo} className="grid grid-cols-[96px_1fr_36px] items-center gap-3">
                      <span className="text-[15px] text-texto">{g.rotulo}</span>
                      <span className="h-2.5 rounded-full bg-superficie3">
                        <span
                          className="block h-full rounded-full bg-auxiliar"
                          style={{ width: `${(g.series / maiorGrupo) * 100}%` }}
                        />
                      </span>
                      <span className="text-right text-[15px] tabular-nums text-auxiliar">{g.series}</span>
                    </div>
                  ))}
                </div>
              </Painel>
            </Revelar>
          )}

          <Revelar atraso={80}>
            <BaixarPdf mes={mes} temFotos={r.fotos.length > 0} />
          </Revelar>
        </>
      )}
    </div>
  );
}

function Numero({
  valor,
  rotulo,
  antes,
  mesAntes,
  largo = false,
}: {
  valor: string;
  rotulo: string;
  antes: string | null;
  mesAntes: string;
  largo?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${largo ? "col-span-2" : ""}`}>
      <span className="text-[26px] leading-none tabular-nums text-texto">{valor}</span>
      <span className="text-[15px] text-auxiliar">{rotulo}</span>
      {/* O mês anterior ao lado, e não uma seta ou cor: a diferença se lê,
          não se julga. */}
      {antes !== null && (
        <span className="text-[14px] text-auxiliar-fraco">
          {mesAntes}: {antes}
        </span>
      )}
    </div>
  );
}

