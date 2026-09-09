import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarGradeMensal, diaDaSemana } from "@/lib/todo/dados";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import Revelar from "@/components/movimento/Revelar";

const INICIAIS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export default async function GradePage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const { ano: anoParam, mes: mesParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("fuso")
    .eq("id", user.id)
    .maybeSingle();

  const hoje = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));
  const [anoHoje, mesHoje] = hoje.split("-").map(Number);
  const ano = Number(anoParam) || anoHoje;
  const mes = Number(mesParam) || mesHoje;

  const grade = await buscarGradeMensal(supabase, user.id, ano, mes);

  // Agrupa os dias por semana (a semana começa no domingo) para que a
  // grade tenha respiro entre os blocos em vez de virar uma fita só.
  const semanas: string[][] = [];
  for (const dia of grade.dias) {
    if (semanas.length === 0 || diaDaSemana(dia) === 0) semanas.push([]);
    semanas[semanas.length - 1].push(dia);
  }

  return (
    <div className="flex grow flex-col gap-8 px-6 pb-10 pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/todo"
          aria-label="Voltar"
          className="-m-3 inline-flex p-3 text-auxiliar"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`/todo/grade?ano=${grade.mesAnterior.ano}&mes=${grade.mesAnterior.mes}`}
            aria-label="Mês anterior"
            className="-m-2 inline-flex p-2 text-auxiliar"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <Link
            href={`/todo/grade?ano=${grade.mesSeguinte.ano}&mes=${grade.mesSeguinte.mes}`}
            aria-label="Próximo mês"
            className="-m-2 inline-flex p-2 text-auxiliar"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>

      <Revelar imediato y={16} className="flex flex-col gap-1">
        <h1 className="text-[21px] text-texto">{grade.rotuloMes}</h1>
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          Só os itens recorrentes entram aqui. Dia cumprido acende; dia sem
          marca fica vazio.
        </p>
      </Revelar>

      {grade.recorrentes.length === 0 ? (
        <p className="text-[15px] leading-[1.6] text-auxiliar">
          Nenhum item recorrente ainda. Um item vira recorrente no detalhe
          dele, na lista do to-do.
        </p>
      ) : (
        <Revelar imediato atraso={120} className="-mx-6">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-max">
              {/* Cabeçalho: inicial do dia, agrupada por semana */}
              <div className="flex items-center">
                <span className="coluna-fixa" />
                <div className="flex gap-4">
                  {semanas.map((semana, i) => (
                    <div key={i} className="flex gap-1.5">
                      {semana.map((dia) => (
                        <span
                          key={dia}
                          className="tipo-rotulo w-5 text-center text-[8.5px] tracking-[.06em] text-auxiliar-minimo"
                        >
                          {INICIAIS_SEMANA[diaDaSemana(dia)]}
                        </span>
                      ))}
                    </div>
                  ))}
                  <span className="w-6 shrink-0" />
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3">
                {grade.recorrentes.map((tarefa) => (
                  <div key={tarefa.id} className="flex items-center">
                    {/* A coluna de nomes acompanha a rolagem: sem ela, o
                        olho perde a linha assim que o mês corre. */}
                    <span className="coluna-fixa truncate text-[13.5px] text-texto">
                      {tarefa.texto}
                    </span>
                    <div className="flex gap-4">
                      {semanas.map((semana, i) => (
                        <div key={i} className="flex gap-1.5">
                          {semana.map((dia) => (
                            <span key={dia} className="flex w-5 justify-center">
                              {grade.marcado.has(`${tarefa.id}|${dia}`) && (
                                <span className="h-[9px] w-[9px] rounded-full bg-acento" />
                              )}
                            </span>
                          ))}
                        </div>
                      ))}
                      <span className="w-6 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Rodapé: número do dia, para localizar a coluna */}
              <div className="mt-3 flex items-center">
                <span className="coluna-fixa" />
                <div className="flex gap-4">
                  {semanas.map((semana, i) => (
                    <div key={i} className="flex gap-1.5">
                      {semana.map((dia) => (
                        <span
                          key={dia}
                          className="w-5 text-center text-[9px] text-auxiliar-minimo"
                        >
                          {Number(dia.slice(8))}
                        </span>
                      ))}
                    </div>
                  ))}
                  <span className="w-6 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </Revelar>
      )}
    </div>
  );
}
