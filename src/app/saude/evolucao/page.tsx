import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, ChevronRight, FileText, Plus, Ruler } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/supabase/auth";
import { buscarEvolucao } from "@/lib/saude/evolucao";
import { hojeDaPessoa } from "@/lib/saude/dados";
import { buscarConjuntoDeFotos } from "@/lib/saude/fotos";
import { umaCasa } from "@/lib/saude/composicao";
import CabecalhoSaude from "../CabecalhoSaude";
import FotosEvolucao from "./FotosEvolucao";
import Painel, { ParValor } from "@/components/saude/Painel";
import PainelSerie from "@/components/saude/PainelSerie";
import type { Ponto } from "@/components/saude/Grafico";
import Revelar from "@/components/movimento/Revelar";
import Progressao from "@/components/saude/Progressao";

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
  const user = await usuarioDaSessao(supabase);
  if (!user) redirect("/login");

  // As fotos não esperam a Evolução: só precisam saber que dia é, e as
  // URLs assinadas são a parte mais lenta da tela.
  const [evo, fotos] = await Promise.all([
    buscarEvolucao(supabase, user.id),
    hojeDaPessoa(supabase, user.id).then((h) => buscarConjuntoDeFotos(supabase, user.id, h.data)),
  ]);

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

      {/* O relatório fica no topo, logo abaixo das abas: é o que se vem
          buscar uma vez por mês, e lá embaixo, depois da Progressão,
          ninguém achava. Junta treino, corpo e fotos do mês, por isso
          aparece com qualquer um dos três. */}
      {(temPeso || temComposicao || evo.progressao.length > 0) && (
        <Revelar imediato atraso={40}>
          <Link
            href="/saude/evolucao/relatorio"
            className="bloco flex min-h-14 items-center justify-between gap-3 px-4 py-3"
          >
            <span className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-auxiliar" strokeWidth={1.75} aria-hidden />
              <span className="flex flex-col">
                <span className="text-[17px] text-texto">Relatório do mês</span>
                <span className="text-[14.5px] text-auxiliar">Treinos, corpo e fotos, em PDF</span>
              </span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-auxiliar" strokeWidth={1.75} aria-hidden />
          </Link>
        </Revelar>
      )}

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
            corrigirEm="/saude/evolucao/nova-medida?data="
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
            corrigirEm="/saude/evolucao/nova-medida?data="
          />
        </Revelar>
      )}

      <Revelar imediato atraso={200}>
        <FotosEvolucao data={evo.hoje} fotos={fotos} />
      </Revelar>

      <Revelar atraso={60} className="pt-3">
        <Progressao grupos={evo.progressao} />
      </Revelar>

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
