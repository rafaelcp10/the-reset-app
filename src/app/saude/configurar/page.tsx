import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarConfig } from "@/lib/saude/dados";
import ConfigForm from "./ConfigForm";

export default async function ConfigurarAcademiaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const config = await buscarConfig(supabase, user.id);

  return (
    <ConfigForm
      localInicial={config.local}
      minutosInicial={config.minutos}
      limitacoesIniciais={config.limitacoes}
    />
  );
}
