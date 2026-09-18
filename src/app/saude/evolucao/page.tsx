import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarEvolucao } from "@/lib/saude/evolucao";
import CabecalhoSaude from "../CabecalhoSaude";
import CampoMedidas from "./CampoMedidas";
import Revelar from "@/components/movimento/Revelar";
import { umaCasa } from "@/lib/saude/composicao";

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
  const deHoje = evo.medidas.find((m) => m.data === evo.hoje);

  const pesagens = evo.medidas.filter((m) => m.peso_kg !== null);
  const registrosDePeso = pesagens.length;

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
        <CampoMedidas
          data={evo.hoje}
          sexo={evo.sexo}
          altura={evo.alturaPerfil}
          valores={{
            peso_kg: deHoje?.peso_kg ?? null,
            pescoco_cm: deHoje?.pescoco_cm ?? null,
            cintura_cm: deHoje?.cintura_cm ?? null,
            quadril_cm: deHoje?.quadril_cm ?? null,
          }}
        />
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
                    de diferença, em {registrosDePeso}{" "}
                    {registrosDePeso === 1 ? "registro" : "registros"}.
                  </p>
                )}

                {registrosDePeso > 1 && (
                  <div className="flex flex-col">
                    {pesagens.slice(0, 10).map((m) => (
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

          {evo.composicaoAtual?.composicao && (
            <Revelar imediato atraso={200} className="flex flex-col gap-3">
              <h2 className="tipo-rotulo px-1 text-[12.5px] tracking-[.18em] text-auxiliar">
                Composição
              </h2>
              <div className="bloco flex flex-col gap-4 px-4 py-4">
                {/* Duas colunas, primeira e última, como a planilha que deu
                    origem a esta tela. Sem faixa de "ideal" ao lado e sem
                    classificação: o número é o que a fita disse. */}
                <table className="w-full border-separate border-spacing-y-1 text-left">
                  <thead>
                    <tr>
                      <th className="w-1/3" />
                      <th className="tipo-rotulo pb-1 text-[12.5px] font-normal tracking-[.2em] text-auxiliar-fraco">
                        Comecei
                      </th>
                      <th className="tipo-rotulo pb-1 text-[12.5px] font-normal tracking-[.2em] text-auxiliar-fraco">
                        Hoje
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <LinhaComposicao
                      rotulo="Gordura"
                      antes={evo.composicaoInicial?.composicao?.gordura ?? null}
                      depois={evo.composicaoAtual.composicao.gordura}
                      sufixo="%"
                    />
                    <LinhaComposicao
                      rotulo="Massa magra"
                      antes={
                        evo.composicaoInicial?.composicao?.massaMagra ?? null
                      }
                      depois={evo.composicaoAtual.composicao.massaMagra}
                      sufixo=" kg"
                    />
                    <LinhaComposicao
                      rotulo="Massa gorda"
                      antes={
                        evo.composicaoInicial?.composicao?.massaGorda ?? null
                      }
                      depois={evo.composicaoAtual.composicao.massaGorda}
                      sufixo=" kg"
                    />
                  </tbody>
                </table>

                {evo.composicaoInicial &&
                evo.composicaoInicial.id !== evo.composicaoAtual.id ? (
                  <p className="text-[15.5px] leading-[1.6] text-auxiliar">
                    De {dataCurta(evo.composicaoInicial.data)} a{" "}
                    {dataCurta(evo.composicaoAtual.data)}.
                  </p>
                ) : (
                  <p className="text-[15.5px] leading-[1.6] text-auxiliar">
                    Esta é a primeira. A partir da segunda esta tabela tem duas
                    colunas de verdade.
                  </p>
                )}
              </div>
            </Revelar>
          )}

          {evo.cargas.length > 0 && (
            <Revelar atraso={60} className="flex flex-col gap-3">
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
            <Revelar atraso={120} className="flex flex-col gap-3">
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

/**
 * Uma linha da tabela de composição.
 *
 * Sem seta e sem cor de veredito: no app inteiro, vermelho é erro de
 * sistema, e subir ou descer aqui depende do que a pessoa está buscando.
 * Também sem âmbar — o acento desta tela já é o peso de hoje, e a distância
 * entre começo e hoje aqui se lê no brilho do texto.
 */
function LinhaComposicao({
  rotulo,
  antes,
  depois,
  sufixo,
}: {
  rotulo: string;
  antes: number | null;
  depois: number | null;
  sufixo: string;
}) {
  if (depois === null) return null;

  return (
    <tr>
      <th
        scope="row"
        className="pr-3 text-[15.5px] font-normal text-auxiliar"
      >
        {rotulo}
      </th>
      <td className="text-[18px] text-auxiliar">
        {antes === null ? "—" : `${umaCasa(antes)}${sufixo}`}
      </td>
      <td className="text-[18px] text-texto">
        {umaCasa(depois)}
        {sufixo}
      </td>
    </tr>
  );
}
