import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarEvolucao } from "@/lib/saude/evolucao";
import CabecalhoSaude from "../CabecalhoSaude";
import CampoPeso from "./CampoPeso";
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

export default async function EvolucaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const evo = await buscarEvolucao(supabase, user.id);
  const pesoDeHoje =
    evo.medidas.find((m) => m.data === evo.hoje)?.peso_kg ?? null;

  const variouPeso =
    evo.pesoInicial !== null &&
    evo.pesoAtual !== null &&
    Number(evo.pesoAtual) !== Number(evo.pesoInicial);

  const nada =
    evo.medidas.length === 0 &&
    evo.cargas.length === 0 &&
    evo.semanasComTreino === 0;

  return (
    <div className="flex grow flex-col gap-8 px-5 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4}>
        <CabecalhoSaude aba="evolucao" />
      </Revelar>

      <Revelar imediato atraso={80}>
        <CampoPeso data={evo.hoje} valorInicial={pesoDeHoje} />
      </Revelar>

      {nada ? (
        <Revelar imediato atraso={140} className="px-1">
          <p className="text-[16.5px] leading-[1.6] text-auxiliar">
            Ainda não há de onde para onde. Registre seu peso e termine um
            treino — a partir do segundo, esta tela passa a ter história.
          </p>
        </Revelar>
      ) : (
        <>
          {evo.pesoInicial !== null && (
            <Revelar imediato atraso={140} className="flex flex-col gap-3">
              <h2 className="tipo-rotulo px-1 text-[12.5px] tracking-[.18em] text-auxiliar">
                Peso
              </h2>
              <div className="bloco flex flex-col gap-4 px-4 py-4">
                <div className="flex gap-10">
                  <div className="flex flex-col gap-1">
                    <span className="tipo-rotulo text-[12.5px] tracking-[.2em] text-auxiliar-fraco">
                      Comecei
                    </span>
                    <span className="text-[21px] text-texto">
                      {kg(evo.pesoInicial)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="tipo-rotulo text-[12.5px] tracking-[.2em] text-auxiliar-fraco">
                      Hoje
                    </span>
                    <span className="text-[21px] text-acento">
                      {kg(evo.pesoAtual)}
                    </span>
                  </div>
                </div>

                {/* Diferença crua, sem percentual e sem seta para cima ou
                    para baixo: subir não é vitória nem derrota — depende do
                    que a pessoa quer, e isso o app não julga. */}
                {variouPeso && (
                  <p className="text-[15.5px] leading-[1.6] text-auxiliar">
                    São{" "}
                    {kg(
                      Math.abs(Number(evo.pesoAtual) - Number(evo.pesoInicial)),
                    )}{" "}
                    de diferença, em {evo.medidas.length}{" "}
                    {evo.medidas.length === 1 ? "registro" : "registros"}.
                  </p>
                )}

                {evo.medidas.length > 1 && (
                  <div className="flex flex-col">
                    {evo.medidas.slice(0, 10).map((m) => (
                      <div
                        key={m.id}
                        className="flex min-h-11 items-baseline justify-between gap-4"
                      >
                        <span className="tipo-rotulo text-[13px] tracking-[.14em] text-auxiliar-fraco">
                          {dataCurta(m.data)}
                        </span>
                        <span className="text-[16.5px] text-texto">
                          {kg(m.peso_kg)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Revelar>
          )}

          {evo.cargas.length > 0 && (
            <Revelar atraso={40} className="flex flex-col gap-3">
              <h2 className="tipo-rotulo px-1 text-[12.5px] tracking-[.18em] text-auxiliar">
                Cargas
              </h2>
              <div className="bloco flex flex-col px-4">
                {evo.cargas.map((c) => (
                  <Link
                    key={c.exercicioId}
                    href={`/saude/exercicios/${c.exercicioId}`}
                    className="flex min-h-[60px] items-center justify-between gap-4 py-2"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[16.5px] leading-[1.3] text-texto">
                        {c.nome}
                      </span>
                      <span className="tipo-rotulo text-[12.5px] tracking-[.16em] text-auxiliar-fraco">
                        {c.treinos} {c.treinos === 1 ? "treino" : "treinos"}
                      </span>
                    </span>
                    <span className="shrink-0 text-[16.5px] text-auxiliar">
                      {kg(c.primeira)}{" "}
                      <span className="text-auxiliar-minimo">→</span>{" "}
                      <span className="text-texto">{kg(c.ultima)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Revelar>
          )}

          {evo.semanasComTreino > 0 && (
            <Revelar atraso={80} className="flex flex-col gap-3">
              <h2 className="tipo-rotulo px-1 text-[12.5px] tracking-[.18em] text-auxiliar">
                Presença
              </h2>
              <div className="bloco px-4 py-4">
                {/* Semanas, nunca dias corridos: a contagem do app inteiro é
                    essa, e uma semana perdida no meio não apaga as outras. */}
                <p className="text-[16.5px] leading-[1.6] text-texto">
                  {evo.semanasComTreino} de {evo.semanasDesdeOComeco}{" "}
                  {evo.semanasDesdeOComeco === 1 ? "semana" : "semanas"} com
                  treino.
                </p>
              </div>
            </Revelar>
          )}
        </>
      )}
    </div>
  );
}
