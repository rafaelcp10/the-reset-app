import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MusicaRow } from "@/lib/ritual/dados";
import ListaMusicas from "./ListaMusicas";

const CAMINHO = "/musicas";
const MAX_FAIXAS = 5;

export default async function MusicasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: musicas } = await supabase
    .from("musicas")
    .select("*")
    .eq("usuario_id", user.id)
    .order("ordem", { ascending: true });

  const porOrdem = new Map(
    ((musicas ?? []) as MusicaRow[]).map((m) => [m.ordem, m]),
  );
  const slots = Array.from({ length: MAX_FAIXAS }, (_, ordem) => ({
    ordem,
    musica: porOrdem.get(ordem) ?? null,
  }));

  return <ListaMusicas slots={slots} caminhoAtual={CAMINHO} />;
}
