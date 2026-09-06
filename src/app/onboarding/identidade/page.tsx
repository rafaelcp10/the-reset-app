import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarFrasesAtuais } from "@/lib/frases/dados";
import { FRASES_PADRAO } from "@/lib/frases/modelo";
import IdentidadeForm from "./IdentidadeForm";

export default async function IdentidadePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const frases = await buscarFrasesAtuais(supabase, user.id);
  const atual = frases.identidade;

  return (
    <IdentidadeForm
      textoBase={atual?.texto ?? FRASES_PADRAO.identidade.texto}
      valorInicial={atual?.preenchimento_lacuna ?? ""}
    />
  );
}
