import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarConfig } from "@/lib/saude/dados";
import ConfigForm from "./ConfigForm";
import {
  GORDURA_G_KG_PADRAO,
  PROTEINA_G_KG_PADRAO,
  type Biotipo,
  type Objetivo,
} from "@/lib/saude/nutricao";

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
      .select(
        "meta_saude, biotipo, garrafa_ml, corrida_km, proteina_g_kg, gordura_g_kg",
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  // `saude_geral` e nulo viram "manter": é o único dos três que não empurra
  // ninguém para lado nenhum.
  const meta = usuario?.meta_saude as string | null;
  const objetivo: Objetivo =
    meta === "perder_peso" || meta === "ganhar_massa" ? meta : "manter";

  const texto = (valor: unknown) =>
    valor === null || valor === undefined ? "" : String(valor);

  return (
    <ConfigForm
      objetivoInicial={objetivo}
      biotipoInicial={(usuario?.biotipo as Biotipo | null) ?? null}
      numerosIniciais={{
        garrafaMl: texto(usuario?.garrafa_ml),
        corridaKm: texto(usuario?.corrida_km),
        // Os dois padrões da planilha aparecem preenchidos: campo vazio
        // faria parecer que a conta não usa nada, quando ela usa.
        proteinaGKg: texto(usuario?.proteina_g_kg ?? PROTEINA_G_KG_PADRAO),
        gorduraGKg: texto(usuario?.gordura_g_kg ?? GORDURA_G_KG_PADRAO),
      }}
      localInicial={config.local}
      minutosInicial={config.minutos}
      limitacoesIniciais={config.limitacoes}
    />
  );
}
