import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarTarefa } from "@/lib/todo/dados";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import Revelar from "@/components/movimento/Revelar";
import DetalheTarefa from "./DetalheTarefa";

export default async function TarefaPage({
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

  const [tarefa, { data: usuario }] = await Promise.all([
    buscarTarefa(supabase, user.id, id),
    supabase.from("usuarios").select("fuso").eq("id", user.id).maybeSingle(),
  ]);
  if (!tarefa) notFound();

  const hoje = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));

  return (
    <div className="flex grow flex-col gap-10 px-6 pb-10 pt-6">
      <Link
        href="/todo"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={16}>
        <DetalheTarefa tarefa={tarefa} dataHoje={hoje} />
      </Revelar>
    </div>
  );
}
