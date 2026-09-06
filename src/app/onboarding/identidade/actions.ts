"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inserirNovaVersaoFrase } from "@/lib/frases/dados";
import { FRASES_PADRAO } from "@/lib/frases/modelo";

export type EstadoIdentidade = { erro?: string };

export async function salvarIdentidade(
  _estadoAnterior: EstadoIdentidade,
  formData: FormData,
): Promise<EstadoIdentidade> {
  const preenchimento = ((formData.get("preenchimento") as string) ?? "").trim();

  if (!preenchimento) {
    return { erro: "Preencha a frase para continuar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await inserirNovaVersaoFrase(
    supabase,
    user.id,
    "identidade",
    FRASES_PADRAO.identidade.texto,
    preenchimento,
  );

  redirect("/onboarding/seguranca");
}
