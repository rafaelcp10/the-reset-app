import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarTreino } from "@/lib/saude/dados";
import { buscarBiblioteca } from "@/lib/saude/movimento";
import DetalheTreino from "./DetalheTreino";

export default async function TreinoPage({
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

  const [dados, biblioteca] = await Promise.all([
    buscarTreino(supabase, user.id, id),
    buscarBiblioteca(supabase, user.id),
  ]);
  if (!dados) notFound();

  return (
    <>
      <div className="px-6 pt-6">
        <Link
          href="/saude"
          aria-label="Voltar"
          className="-m-3 inline-flex p-3 text-auxiliar"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </Link>
      </div>
      <DetalheTreino
        treino={dados.treino}
        exercicios={dados.exercicios}
        biblioteca={biblioteca}
      />
    </>
  );
}
