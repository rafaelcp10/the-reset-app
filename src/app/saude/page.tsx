import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarConfig, buscarTreinos, hojeDaPessoa } from "@/lib/saude/dados";
import { buscarSessaoAberta } from "@/lib/saude/sessao";
import { DIAS_ABREV } from "@/lib/saude/semana";
import CabecalhoSaude from "./CabecalhoSaude";
import IniciarTreino from "./IniciarTreino";
import NovoTreino from "./NovoTreino";
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

  const opcoes = treinos.map((t) => ({
    id: t.id,
    nome: t.nome,
    dias: t.dias_semana ?? [],
    totalExercicios: t.totalExercicios,
    deHoje: (t.dias_semana ?? []).includes(hoje.diaSemana),
  }));
  const temHoje = opcoes.some((o) => o.deHoje);

  return (
    <div className="flex grow flex-col gap-10 px-5 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4}>
        <CabecalhoSaude aba="treino" />
      </Revelar>

      {treinos.length === 0 ? (
        <Revelar imediato atraso={80} className="flex flex-col gap-4 px-1">
          <p className="text-[16.5px] leading-[1.6] text-auxiliar">
            Um treino é um molde: os exercícios que você faz junto, nos dias em
            que faz. Dê um nome e monte dentro.
          </p>
        </Revelar>
      ) : (
        <Revelar imediato atraso={80} className="flex flex-col gap-4">
          <p className="px-1 text-[15.5px] leading-[1.6] text-auxiliar">
            {temHoje
              ? "Hoje tem treino marcado."
              : "Hoje é descanso — mas se quiser treinar, é só escolher qual."}
          </p>
          <IniciarTreino opcoes={opcoes} data={hoje.data} />
        </Revelar>
      )}

      {treinos.length > 0 && (
        <Revelar atraso={40} className="flex flex-col gap-3">
          <h2 className="tipo-rotulo px-1 text-[12.5px] tracking-[.18em] text-auxiliar">
            Seus treinos
          </h2>
          <div className="flex flex-col gap-2">
            {treinos.map((treino) => (
              <Link
                key={treino.id}
                href={`/saude/treinos/${treino.id}`}
                className="bloco bloco-toque flex min-h-[64px] items-center justify-between gap-3 px-4"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-[16px] leading-[1.3] text-texto">
                    {treino.nome}
                  </span>
                  <span className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar-fraco">
                    {treino.dias_semana?.length
                      ? treino.dias_semana.map((d) => DIAS_ABREV[d]).join(" · ")
                      : "sem dia marcado"}
                    {" — "}
                    {treino.totalExercicios}{" "}
                    {treino.totalExercicios === 1 ? "exercício" : "exercícios"}
                  </span>
                </span>
                <ChevronRight
                  className="h-[22px] w-[22px] shrink-0 text-auxiliar-minimo"
                  strokeWidth={1.5}
                />
              </Link>
            ))}
          </div>
        </Revelar>
      )}

      <Revelar atraso={80} className="px-1">
        <NovoTreino />
      </Revelar>
    </div>
  );
}
