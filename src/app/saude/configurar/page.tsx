import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarConfig } from "@/lib/saude/dados";
import ConfigForm from "./ConfigForm";
import type { Objetivo } from "@/lib/saude/nutricao";

export default async function ConfigurarAcademiaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [config, { data: usuario }] = await Promise.all([
    buscarConfig(supabase, user.id),
    supabase
      .from("usuarios")
      .select("meta_saude")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  // `saude_geral` e nulo viram "manter": é o único dos três que não empurra
  // ninguém para lado nenhum.
  const meta = usuario?.meta_saude as string | null;
  const objetivo: Objetivo =
    meta === "perder_peso" || meta === "ganhar_massa" ? meta : "manter";

  return (
    <ConfigForm
      objetivoInicial={objetivo}
      localInicial={config.local}
      minutosInicial={config.minutos}
      limitacoesIniciais={config.limitacoes}
    />
  );
}
