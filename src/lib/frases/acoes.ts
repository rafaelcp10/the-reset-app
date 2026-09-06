"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { inserirNovaVersaoFrase } from "@/lib/frases/dados";
import { FRASES_PADRAO, type Funcao } from "@/lib/frases/modelo";

export type EstadoEdicaoFrase = { erro?: string; salvoEm?: number };

export async function salvarEdicaoFrase(
  funcao: Funcao,
  caminhoAtual: string,
  _estadoAnterior: EstadoEdicaoFrase,
  formData: FormData,
): Promise<EstadoEdicaoFrase> {
  const texto = ((formData.get("texto") as string) ?? "").trim();

  if (!texto) {
    return { erro: "A frase não pode ficar vazia." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await inserirNovaVersaoFrase(supabase, user.id, funcao, texto, null);
  revalidatePath(caminhoAtual);

  return { salvoEm: Date.now() };
}

/** Edita só o preenchimento da lacuna da identidade (fora do onboarding). */
export async function salvarLacuna(
  caminhoAtual: string,
  _estadoAnterior: EstadoEdicaoFrase,
  formData: FormData,
): Promise<EstadoEdicaoFrase> {
  const preenchimento = ((formData.get("preenchimento") as string) ?? "").trim();

  if (!preenchimento) {
    return { erro: "A frase não pode ficar vazia." };
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
  revalidatePath(caminhoAtual);

  return { salvoEm: Date.now() };
}
