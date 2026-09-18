import { redirect } from "next/navigation";
import { CalendarDays, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarConfig, buscarTreinos, hojeDaPessoa } from "@/lib/saude/dados";
import { buscarSessaoAberta } from "@/lib/saude/sessao";
import { DIAS_ABREV, resumoDaSemana } from "@/lib/saude/semana";
import CabecalhoSaude from "./CabecalhoSaude";
import IniciarTreino from "./IniciarTreino";
import NovoTreino from "./NovoTreino";
import Painel, { Barra, LinhaDoPainel } from "@/components/saude/Painel";
import SemanaDeTreino from "@/components/saude/SemanaDeTreino";
import Revelar from "@/components/movimento/Revelar";

export default async function AcademiaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);

  const [config, treinos, hoje, aberta] = await Promise.all([
    buscarConfig(supabase, user.id),
    buscarTreinos(supabase, user.id),
    hojeDaPessoa(supabase, user.id),
    buscarSessaoAberta(supabase, user.id),
  ]);

  // Quem nunca respondeu as cinco perguntas começa por elas.
  if (!config.configurada) redirect("/saude/configurar");

  // Com treino em curso, a aba inteira é esse treino: qualquer outra coisa
  // aqui seria convite para abandonar o que já está começado.
  if (aberta) redirect(`/saude/treinos/${aberta.treino_id}/sessao`);

  const diasMarcados = [
    ...new Set(treinos.flatMap((t) => t.dias_semana ?? [])),
  ];
  const semana = await resumoDaSemana(
    supabase,
    user.id,
    hoje.data,
    hoje.diaSemana,
    diasMarcados,
  );

  const opcoes = treinos.map((t) => ({
    id: t.id,
    nome: t.nome,
    dias: t.dias_semana ?? [],
    totalExercicios: t.totalExercicios,
    deHoje: (t.dias_semana ?? []).includes(hoje.diaSemana),
  }));

  return (
    <div className="flex grow flex-col gap-5 px-5 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4} className="mb-2">
        <CabecalhoSaude aba="treino" />
      </Revelar>

      {treinos.length === 0 ? (
        <Revelar imediato atraso={80} className="px-1">
          <p className="text-[16.5px] leading-[1.6] text-auxiliar">
            Um treino é um molde: os exercícios que você faz junto, nos dias em
            que faz. Dê um nome e monte dentro.
          </p>
        </Revelar>
      ) : (
        <>
          <Revelar imediato atraso={80}>
            <Painel icone={CalendarDays} rotulo="A semana">
              <div className="flex items-baseline gap-1.5">
                <span className="text-[34px] leading-none tabular-nums text-texto">
                  {semana.feitos}
                </span>
                <span className="text-[15px] text-auxiliar">
                  {semana.marcados > 0
                    ? `de ${semana.marcados} ${semana.marcados === 1 ? "dia marcado" : "dias marcados"}`
                    : semana.feitos === 1
                      ? "treino"
                      : "treinos"}
                </span>
              </div>

              <Barra feito={semana.feitos} total={semana.marcados} />
              <SemanaDeTreino dias={semana.dias} />
            </Painel>
          </Revelar>

          <Revelar imediato atraso={140}>
            <IniciarTreino opcoes={opcoes} data={hoje.data} />
          </Revelar>

          <Revelar atraso={40}>
            <Painel icone={ListChecks} rotulo="Seus treinos">
              <div className="flex flex-col gap-2">
                {treinos.map((treino) => (
                  <LinhaDoPainel
                    key={treino.id}
                    href={`/saude/treinos/${treino.id}`}
                    titulo={treino.nome}
                    detalhe={`${
                      treino.dias_semana?.length
                        ? treino.dias_semana
                            .map((d) => DIAS_ABREV[d])
                            .join(" · ")
                        : "sem dia marcado"
                    } — ${treino.totalExercicios} ${
                      treino.totalExercicios === 1 ? "exercício" : "exercícios"
                    }`}
                  />
                ))}
              </div>
            </Painel>
          </Revelar>
        </>
      )}

      <Revelar atraso={80} className="px-1 pt-2">
        <NovoTreino />
      </Revelar>
    </div>
  );
}
