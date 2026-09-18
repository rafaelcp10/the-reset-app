import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarEvolucao } from "@/lib/saude/evolucao";
import { buscarParDeFotos } from "@/lib/saude/fotos";
import { umaCasa } from "@/lib/saude/composicao";
import CabecalhoSaude from "../CabecalhoSaude";
import CampoMedidas from "./CampoMedidas";
import FotosEvolucao from "./FotosEvolucao";
import Metrica from "@/components/saude/Metrica";
import Grafico, { type Ponto } from "@/components/saude/Grafico";
import Revelar from "@/components/movimento/Revelar";

/** 60, não 60,00. */
function kg(valor: number | null): string {
  if (valor === null) return "—";
  const n = Number(valor);
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}

function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}

/**
 * "−1,1 kg desde 25/11."
 *
 * Sem seta, sem percentual e sem cor: subir não é vitória nem derrota —
 * depende do que a pessoa quer, e isso o app não sabe. O sinal é o de
 * menos de verdade (−), não o hífen, porque ao lado de um número grande o
 * hífen parece sujeira.
 */
function desde(
  inicial: number,
  atual: number,
  data: string,
  unidade: string,
): string {
  const delta = atual - inicial;
  if (Math.abs(delta) < 0.05) return `Igual a ${dataCurta(data)}`;
  const sinal = delta > 0 ? "+" : "−";
  return `${sinal}${umaCasa(Math.abs(delta))}${unidade} desde ${dataCurta(data)}`;
}

/** Só a diferença, sem a data: nos painéis de duas colunas ela não cabe
 *  numa linha, e os dois painéis acima já disseram desde quando. */
function variacao(inicial: number, atual: number, unidade: string): string {
  const delta = atual - inicial;
  if (Math.abs(delta) < 0.05) return "Igual ao começo";
  return `${delta > 0 ? "+" : "−"}${umaCasa(Math.abs(delta))}${unidade}`;
}

export default async function EvolucaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const evo = await buscarEvolucao(supabase, user.id);
  const fotos = await buscarParDeFotos(supabase, user.id, evo.hoje);

  const deHoje = evo.medidas.find((m) => m.data === evo.hoje);

  // As buscas devolvem da mais recente para a mais antiga; a curva anda
  // para a frente no tempo, então aqui inverte.
  const pesagens = evo.medidas.filter((m) => m.peso_kg !== null).reverse();
  const curvaPeso: Ponto[] = pesagens.map((m) => ({
    data: m.data,
    valor: Number(m.peso_kg),
  }));

  const compostas = evo.medidas.filter((m) => m.composicao !== null).reverse();
  const curvaGordura: Ponto[] = compostas.map((m) => ({
    data: m.data,
    valor: m.composicao!.gordura,
  }));

  const composicao = evo.composicaoAtual?.composicao ?? null;
  const inicial = evo.composicaoInicial?.composicao ?? null;
  const dataInicial = evo.composicaoInicial?.data ?? null;
  const temSerieDeGordura = curvaGordura.length > 1 && inicial && dataInicial;

  const nada =
    evo.medidas.length === 0 &&
    evo.cargas.length === 0 &&
    evo.semanasComTreino === 0 &&
    fotos.total === 0;

  return (
    <div className="flex grow flex-col gap-5 px-5 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4} className="mb-2">
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

      <Revelar imediato atraso={140}>
        <FotosEvolucao data={evo.hoje} fotos={fotos} />
      </Revelar>

      {nada && (
        <Revelar imediato atraso={200} className="px-1 pt-3">
          <p className="text-[16.5px] leading-[1.6] text-auxiliar">
            Ainda não há de onde para onde. Registre seu peso e termine um
            treino — a partir do segundo, esta tela passa a ter história.
          </p>
        </Revelar>
      )}

      {/* O painel principal da tela, e a única aplicação de âmbar: é o número
          que se abre a aba para conferir. */}
      {evo.pesoAtual !== null && (
        <Revelar atraso={40} className="pt-3">
          <Metrica
            destaque
            rotulo="Peso"
            valor={kg(evo.pesoAtual)}
            unidade="kg"
            nota={
              evo.pesoInicial !== null && pesagens.length > 1
                ? desde(
                    Number(evo.pesoInicial),
                    Number(evo.pesoAtual),
                    pesagens[0].data,
                    " kg",
                  )
                : "Primeira pesagem"
            }
          >
            <Grafico
              acento
              pontos={curvaPeso}
              descricao={`Peso de ${kg(evo.pesoInicial)} a ${kg(evo.pesoAtual)} quilos, em ${curvaPeso.length} registros.`}
            />
          </Metrica>
        </Revelar>
      )}

      {composicao && (
        <>
          <Revelar atraso={60}>
            <Metrica
              rotulo="Gordura"
              valor={umaCasa(composicao.gordura)}
              unidade="%"
              nota={
                temSerieDeGordura
                  ? desde(inicial.gordura, composicao.gordura, dataInicial, " p.p.")
                  : "Primeira medida"
              }
            >
              <Grafico
                pontos={curvaGordura}
                descricao={`Percentual de gordura de ${umaCasa(inicial?.gordura ?? composicao.gordura)} a ${umaCasa(composicao.gordura)} por cento.`}
              />
            </Metrica>
          </Revelar>

          {composicao.massaMagra !== null && composicao.massaGorda !== null && (
            <Revelar atraso={80} className="grid grid-cols-2 gap-3">
              <Metrica
                rotulo="Massa magra"
                valor={umaCasa(composicao.massaMagra)}
                unidade="kg"
                nota={
                  temSerieDeGordura && inicial.massaMagra !== null
                    ? variacao(inicial.massaMagra, composicao.massaMagra, " kg")
                    : null
                }
              />
              <Metrica
                rotulo="Massa gorda"
                valor={umaCasa(composicao.massaGorda)}
                unidade="kg"
                nota={
                  temSerieDeGordura && inicial.massaGorda !== null
                    ? variacao(inicial.massaGorda, composicao.massaGorda, " kg")
                    : null
                }
              />
            </Revelar>
          )}
        </>
      )}

      {evo.cargas.length > 0 && (
        <Revelar atraso={100} className="flex flex-col gap-3 pt-3">
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
                <span className="shrink-0 text-[16.5px] tabular-nums text-auxiliar">
                  {kg(c.primeira)}{" "}
                  <span className="text-auxiliar-minimo">→</span>{" "}
                  <span className="text-texto">{kg(c.ultima)} kg</span>
                </span>
              </Link>
            ))}
          </div>
        </Revelar>
      )}

      {evo.semanasComTreino > 0 && (
        <Revelar atraso={120}>
          {/* Semanas, nunca dias corridos: a contagem do app inteiro é essa,
              e uma semana perdida no meio não apaga as outras. */}
          <Metrica
            rotulo="Presença"
            valor={`${evo.semanasComTreino}/${evo.semanasDesdeOComeco}`}
            nota={`${evo.semanasDesdeOComeco === 1 ? "semana" : "semanas"} com treino`}
          />
        </Revelar>
      )}
    </div>
  );
}
