import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarSessao } from "@/lib/academia/sessao";
import SessaoTreino from "./SessaoTreino";
import Revelar from "@/components/movimento/Revelar";

export default async function SessaoPage({
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

  const sessao = await buscarSessao(supabase, user.id, id);
  if (!sessao) notFound();

  return (
    <div className="flex grow flex-col gap-8 px-6 pb-10 pt-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/academia"
          aria-label="Voltar"
          className="-m-3 inline-flex p-3 text-auxiliar"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
        <Link
          href={`/academia/treinos/${id}`}
          aria-label="Editar o treino"
          className="-m-3 inline-flex p-3 text-auxiliar"
        >
          <Pencil className="h-[17px] w-[17px]" strokeWidth={1.5} />
        </Link>
      </div>

      <Revelar imediato y={14} className="flex flex-col gap-1">
        <h1 className="text-[21px] text-texto">{sessao.treino.nome}</h1>
        <p className="text-[13px] leading-[1.6] text-auxiliar">
          Confirme o que você fez. Mudar para menos grava igual — é isso que
          vira a base do próximo.
        </p>
      </Revelar>

      <Revelar imediato atraso={100}>
        {sessao.itens.length === 0 ? (
          <p className="text-[15px] leading-[1.6] text-auxiliar">
            Este treino ainda não tem exercícios.
          </p>
        ) : (
          <SessaoTreino
            itens={sessao.itens}
            treinoId={id}
            data={sessao.data}
          />
        )}
      </Revelar>
    </div>
  );
}
