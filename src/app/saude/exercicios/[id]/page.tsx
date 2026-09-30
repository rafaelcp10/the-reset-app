import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarHistorico } from "@/lib/saude/sessao";
import { ROTULO_GRUPO } from "@/lib/saude/catalogo";
import {
  cargasDoRegistro,
  faixaDeCargas,
  resumoDeReps,
} from "@/lib/saude/serie";
import Revelar from "@/components/movimento/Revelar";
import Voltar from "@/components/Voltar";
import { montarProgresso } from "@/lib/saude/progresso";
import ProgressoExercicio from "./ProgressoExercicio";

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

  const { movimento, plano, registros } = historico;

  return (
    <div className="flex grow flex-col gap-9 px-6 pb-10 pt-6">
      <Voltar reserva="/saude/evolucao" />

      <Revelar imediato y={14} className="flex flex-col gap-1">
        <h1 className="text-[21px] leading-[1.3] text-texto">
          {movimento.nome}
        </h1>
        {movimento.grupo && (
          <span className="tipo-rotulo text-[13.5px] tracking-[.12em] text-auxiliar-fraco">
            {ROTULO_GRUPO[movimento.grupo]}
          </span>
        )}
      </Revelar>

      {registros.length === 0 ? (
        <p className="text-[16.5px] leading-[1.6] text-auxiliar">
          Nada registrado ainda. O primeiro treino vira a base de tudo.
        </p>
      ) : (
        <>
          {/* A curva no lugar de "Comecei / Última vez" e de uma frase
              sobre a diferença: dois números e uma frase não mostravam o
              caminho, e é o caminho que se vem conferir aqui. */}
          <Revelar imediato atraso={80}>
            <ProgressoExercicio
              progresso={montarProgresso(registros)}
              treinos={registros.length}
            />
          </Revelar>

          <Revelar atraso={40} className="flex flex-col gap-4">
            <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
              Cada vez
            </h2>
            <div className="bloco flex flex-col px-4 py-1.5">
              {registros.map((registro) => (
                <div
                  key={registro.id}
                  className="flex min-h-11 items-baseline justify-between gap-4"
                >
                  <span className="tipo-rotulo w-12 shrink-0 text-[14px] tracking-[.1em] text-auxiliar-fraco">
                    {dataCurta(registro.data)}
                  </span>
                  {/* No variável a carga sai em faixa — "40 a 55 kg" —
                      porque uma pirâmide não tem uma carga só, e escolher
                      uma delas para mostrar seria escolher errado. */}
                  <span className="flex-1 text-[16.5px] text-auxiliar">
                    {registro.repeticoes_serie?.length
                      ? resumoDeReps(registro.repeticoes_serie.map(Number))
                      : `${registro.series ?? plano?.series ?? 1}×${registro.repeticoes ?? plano?.repeticoes ?? "—"}`}
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
