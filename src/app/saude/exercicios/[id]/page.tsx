import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarHistorico } from "@/lib/saude/sessao";
import { ROTULO_GRUPO } from "@/lib/saude/catalogo";
import {
  cargasDoRegistro,
  faixaDeCargas,
  resumoDeReps,
} from "@/lib/saude/serie";
import Revelar from "@/components/movimento/Revelar";

/** 60, não 60,00. */
function kg(valor: number | null): string {
  if (valor === null) return "—";
  const n = Number(valor);
  return `${n % 1 === 0 ? n : n.toFixed(1).replace(".", ",")} kg`;
}

function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

export default async function HistoricoExercicioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const historico = await buscarHistorico(supabase, user.id, id);
  if (!historico) notFound();

  const { exercicio, registros, primeiro, ultimo } = historico;
  const inicial = primeiro?.carga_kg ?? null;
  const atual = ultimo?.carga_kg ?? null;
  const subiu =
    inicial !== null && atual !== null ? Number(atual) - Number(inicial) : null;

  return (
    <div className="flex grow flex-col gap-9 px-6 pb-10 pt-6">
      <Link
        href={`/saude/treinos/${exercicio.treino_id}/sessao`}
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={14} className="flex flex-col gap-1">
        <h1 className="text-[21px] leading-[1.3] text-texto">
          {exercicio.nome}
        </h1>
        {exercicio.grupo && (
          <span className="tipo-rotulo text-[12.5px] tracking-[.22em] text-auxiliar-fraco">
            {ROTULO_GRUPO[exercicio.grupo]}
          </span>
        )}
      </Revelar>

      {registros.length === 0 ? (
        <p className="text-[16.5px] leading-[1.6] text-auxiliar">
          Nada registrado ainda. O primeiro treino vira a base de tudo.
        </p>
      ) : (
        <>
          <Revelar imediato atraso={80} className="flex flex-col gap-5">
            <div className="flex gap-10">
              <div className="flex flex-col gap-1">
                <span className="tipo-rotulo text-[12.5px] tracking-[.2em] text-auxiliar-fraco">
                  Comecei
                </span>
                <span className="text-[19px] text-texto">{kg(inicial)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="tipo-rotulo text-[12.5px] tracking-[.2em] text-auxiliar-fraco">
                  Última vez
                </span>
                <span className="text-[19px] text-acento">{kg(atual)}</span>
              </div>
            </div>

            {/* Sem gráfico e sem percentual: é um registro do que aconteceu,
                não uma nota de desempenho. */}
            {subiu !== null && subiu !== 0 && (
              <p className="text-[15.5px] leading-[1.6] text-auxiliar">
                {subiu > 0
                  ? `São ${kg(subiu)} a mais desde o começo, em ${registros.length} ${registros.length === 1 ? "treino" : "treinos"}.`
                  : `Hoje está ${kg(Math.abs(subiu))} abaixo de onde começou. A base é essa, e daqui sobe de novo.`}
              </p>
            )}
          </Revelar>

          <Revelar atraso={40} className="flex flex-col gap-4">
            <h2 className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar">
              Cada vez
            </h2>
            <div className="flex flex-col">
              {registros.map((registro) => (
                <div
                  key={registro.id}
                  className="flex min-h-11 items-baseline justify-between gap-4"
                >
                  <span className="tipo-rotulo w-12 shrink-0 text-[13px] tracking-[.14em] text-auxiliar-fraco">
                    {dataCurta(registro.data)}
                  </span>
                  {/* No variável a carga sai em faixa — "40 a 55 kg" —
                      porque uma pirâmide não tem uma carga só, e escolher
                      uma delas para mostrar seria escolher errado. */}
                  <span className="flex-1 text-[16.5px] text-auxiliar">
                    {registro.repeticoes_serie?.length
                      ? resumoDeReps(registro.repeticoes_serie.map(Number))
                      : `${registro.series ?? exercicio.series}×${registro.repeticoes ?? exercicio.repeticoes}`}
                  </span>
                  <span className="shrink-0 text-[16px] text-texto">
                    {registro.repeticoes_serie?.length
                      ? faixaDeCargas(
                          cargasDoRegistro(
                            registro,
                            registro.repeticoes_serie.length,
                          ),
                        )
                      : kg(registro.carga_kg)}
                  </span>
                </div>
              ))}
            </div>
          </Revelar>
        </>
      )}
    </div>
  );
}
