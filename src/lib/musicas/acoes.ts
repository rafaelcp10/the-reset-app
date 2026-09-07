"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Define a faixa de um slot (0 a 4) — até 5 músicas por usuário. */
export async function salvarFaixaSlot(
  caminhoAtual: string,
  ordem: number,
  formData: FormData,
) {
  const url = ((formData.get("url") as string) ?? "").trim();
  if (!url) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("musicas").upsert(
    { usuario_id: user.id, url, ordem },
    { onConflict: "usuario_id,ordem" },
  );

  revalidatePath(caminhoAtual);
}

/** Remove a faixa de um slot, liberando-o. */
export async function removerFaixaSlot(caminhoAtual: string, ordem: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("musicas")
    .delete()
    .eq("usuario_id", user.id)
    .eq("ordem", ordem);

  revalidatePath(caminhoAtual);
}
