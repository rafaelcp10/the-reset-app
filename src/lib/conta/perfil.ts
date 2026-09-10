"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VALORES_META } from "./metas";

export type EstadoPerfil = { erro?: string };


function numeroOuNulo(bruto: string, minimo: number, maximo: number) {
  const valor = Number(bruto.replace(",", "."));
  if (!Number.isFinite(valor) || valor < minimo || valor > maximo) return null;
  return valor;
}

/**
 * Guarda o perfil. Só o nome é obrigatório — o resto serve à aba Academia,
 * que ainda não existe, e ninguém deve ser barrado do ritual por não
 * querer informar o próprio peso.
 */
export async function salvarPerfil(
  _anterior: EstadoPerfil,
  formData: FormData,
): Promise<EstadoPerfil> {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  if (!nome) return { erro: "Como você quer ser chamado?" };

  const nascimento = ((formData.get("nascimento") as string) ?? "").trim();
  const meta = ((formData.get("meta") as string) ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("usuarios")
    .update({
      nome,
      nascimento: nascimento || null,
      altura_cm: numeroOuNulo((formData.get("altura") as string) ?? "", 80, 250),
      peso_kg: numeroOuNulo((formData.get("peso") as string) ?? "", 25, 400),
      meta_saude: VALORES_META.includes(meta) ? meta : null,
      perfil_completo_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect("/onboarding/instalar");
}
