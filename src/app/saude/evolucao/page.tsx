import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Plus, Ruler } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarEvolucao } from "@/lib/saude/evolucao";
import { buscarConjuntoDeFotos } from "@/lib/saude/fotos";
import { umaCasa } from "@/lib/saude/composicao";
import CabecalhoSaude from "../CabecalhoSaude";
import FotosEvolucao from "./FotosEvolucao";
import Painel, { ParValor } from "@/components/saude/Painel";
import PainelSerie from "@/components/saude/PainelSerie";
import type { Ponto } from "@/components/saude/Grafico";
import Revelar from "@/components/movimento/Revelar";

/** 60, não 60,00. */
function kg(valor: number | null): string {
  if (valor === null) return "—";
  const n = Number(valor);
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(".", ",");
}

/**
 * O "+" que abre a tela de medir.
 *
 * Um mais, e não uma engrenagem: o cabeçalho da Saúde já tem uma, que
 * abre os ajustes de treino, e duas engrenagens na mesma tela levando a
 * lugares diferentes é convite para tocar na errada.
 */
function BotaoMedir() {
  return (
    <Link
      href="/saude/evolucao/nova-medida"
      aria-label="Registrar uma nova medida"
      className="-mr-2 -mt-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] text-auxiliar"
    >
      <Plus className="h-[22px] w-[22px]" strokeWidth={1.5} />
    </Link>
  );
}

export default async function EvolucaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const evo = await buscarEvolucao(supabase, user.id);
  const fotos = await buscarConjuntoDeFotos(supabase, user.id, evo.hoje);

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
  const temComposicao = curvaGordura.length > 0 && composicao !== null;
  const temPeso = curvaPeso.length > 0;

  return (
    <div className="flex grow flex-col gap-5 px-5 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4} className="mb-2">
        <CabecalhoSaude aba="evolucao" />
      </Revelar>

      {/* Nada medido ainda: o "+" sozinho não explicaria nada, então aqui
          o convite é escrito. */}
      {!temPeso && !temComposicao && (
        <Revelar imediato atraso={80}>
          <Painel icone={Ruler} rotulo="Comece por aqui">
            <p className="text-[16px] leading-[1.6] text-auxiliar">
              Peso, pescoço e cintura. Três minutos com uma fita métrica, e
              esta tela passa a ter o que dizer.
            </p>
            <Link
              href="/saude/evolucao/nova-medida"
              className="botao-acento tipo-rotulo mt-1 block w-full rounded-[12px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
            >
              Primeira medida
            </Link>
          </Painel>
        </Revelar>
      )}

      {/* O resultado da fita lidera: é o que a medida da semana produziu,
          e é o que se abre a aba para conferir. */}
      {temComposicao && (
        <Revelar imediato atraso={80}>
          <PainelSerie
            rotulo="Composição"
            unidade="%"
            pontos={curvaGordura}
            formato="uma-casa"
            descricao={`Percentual de gordura, ${curvaGordura.length} ${curvaGordura.length === 1 ? "medida" : "medidas"}. Arraste para ver cada uma.`}
            acao={<BotaoMedir />}
            rodape={
              composicao.massaMagra !== null && composicao.massaGorda !== null ? (
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                  <ParValor
                    valor={`${umaCasa(composicao.massaMagra)} kg`}
                    rotulo="massa magra"
                  />
                  <ParValor
                    valor={`${umaCasa(composicao.massaGorda)} kg`}
                    rotulo="massa gorda"
                  />
                </div>
              ) : null
            }
          />
        </Revelar>
      )}

      {temPeso && (
        <Revelar imediato atraso={140}>
          <PainelSerie
            rotulo="Peso"
            unidade="kg"
            pontos={curvaPeso}
            formato="enxuto"
            descricao={`Peso, ${curvaPeso.length} ${curvaPeso.length === 1 ? "registro" : "registros"}. Arraste para ver cada um.`}
            acao={temComposicao ? undefined : <BotaoMedir />}
          />
        </Revelar>
      )}

      <Revelar imediato atraso={200}>
        <FotosEvolucao data={evo.hoje} fotos={fotos} />
      </Revelar>

      {evo.cargas.length > 0 && (
        <Revelar atraso={60} className="flex flex-col gap-3 pt-3">
          <h2 className="tipo-rotulo px-1 text-[13.5px] tracking-[.1em] text-auxiliar">
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
                  <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco">
                    {c.treinos} {c.treinos === 1 ? "treino" : "treinos"}
                  </span>
                </span>
                <span className="shrink-0 text-[16.5px] tabular-nums text-auxiliar">
                  {kg(c.primeira)}{" "}
                  <span className="text-auxiliar-fraco">→</span>{" "}
                  <span className="text-texto">{kg(c.ultima)} kg</span>
                </span>
              </Link>
            ))}
          </div>
        </Revelar>
      )}

      {evo.semanasComTreino > 0 && (
        <Revelar atraso={100}>
          {/* Semanas, nunca dias corridos: a contagem do app inteiro é essa,
              e uma semana perdida no meio não apaga as outras. */}
          <Painel icone={CalendarCheck} rotulo="Presença">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] leading-none tabular-nums text-texto">
                {evo.semanasComTreino}/{evo.semanasDesdeOComeco}
              </span>
              <span className="text-[16px] text-auxiliar">
                {evo.semanasDesdeOComeco === 1 ? "semana" : "semanas"} com treino
              </span>
            </div>
          </Painel>
        </Revelar>
      )}
    </div>
  );
}
