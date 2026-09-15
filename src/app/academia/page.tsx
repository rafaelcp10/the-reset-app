import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarConfig, buscarTreinos, hojeDaPessoa } from "@/lib/academia/dados";
import { DIAS_ABREV } from "@/lib/academia/semana";
import NovoTreino from "./NovoTreino";
import Revelar from "@/components/movimento/Revelar";

export default async function AcademiaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);

  const [config, treinos, hoje] = await Promise.all([
    buscarConfig(supabase, user.id),
    buscarTreinos(supabase, user.id),
    hojeDaPessoa(supabase, user.id),
  ]);

  // Quem nunca respondeu as cinco perguntas começa por elas.
  if (!config.configurada) redirect("/academia/configurar");

  const deHoje = treinos.filter((t) => t.dias_semana?.includes(hoje.diaSemana));

  return (
    <div className="flex grow flex-col gap-12 px-6 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4}>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-[21px] text-texto">Academia</h1>
          <Link
            href="/academia/configurar"
            aria-label="Ajustar como você treina"
            className="-m-3 inline-flex shrink-0 p-3 text-auxiliar"
          >
            <Settings className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </Link>
        </div>
      </Revelar>

      <Revelar imediato atraso={80} className="flex flex-col gap-4">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Hoje
        </h2>
        {deHoje.length === 0 ? (
          <p className="text-[15px] leading-[1.6] text-auxiliar">
            {treinos.length === 0
              ? "Monte seu primeiro treino abaixo."
              : "Hoje é descanso."}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {deHoje.map((treino) => (
              <Link
                key={treino.id}
                href={`/academia/treinos/${treino.id}/sessao`}
                className="flex min-h-14 items-center justify-between gap-3"
              >
                <span className="text-[18px] leading-[1.5] text-texto">
                  {treino.nome}
                </span>
                <span className="tipo-rotulo shrink-0 text-[10px] tracking-[.16em] text-auxiliar-fraco">
                  {treino.totalExercicios}{" "}
                  {treino.totalExercicios === 1 ? "exercício" : "exercícios"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Revelar>

      <Revelar atraso={40} className="flex flex-col gap-4">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Seus treinos
        </h2>

        {treinos.length === 0 ? (
          <p className="text-[15px] leading-[1.6] text-auxiliar">
            Um treino é um molde: os exercícios que você faz junto, nos dias em
            que faz. Dê um nome e monte dentro.
          </p>
        ) : (
          <div className="flex flex-col">
            {treinos.map((treino) => (
              <Link
                key={treino.id}
                href={`/academia/treinos/${treino.id}`}
                className="flex min-h-14 flex-col justify-center gap-0.5 py-2"
              >
                <span className="text-[17px] leading-[1.4] text-texto">
                  {treino.nome}
                </span>
                <span className="tipo-rotulo text-[9.5px] tracking-[.18em] text-auxiliar-fraco">
                  {treino.dias_semana?.length
                    ? treino.dias_semana
                        .map((d) => DIAS_ABREV[d])
                        .join(" · ")
                    : "sem dia marcado"}
                  {" — "}
                  {treino.totalExercicios}{" "}
                  {treino.totalExercicios === 1 ? "exercício" : "exercícios"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Revelar>

      <Revelar atraso={80}>
        <NovoTreino />
      </Revelar>
    </div>
  );
}
