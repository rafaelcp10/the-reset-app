"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type InscricaoPush = {
  endpoint: string;
  chaves: { p256dh: string; auth: string };
};

/**
 * Guarda o aparelho que aceitou receber o check-in. Um usuário pode ter
 * vários (celular, tablet), então a chave é o endpoint, não o usuário.
 */
export async function salvarInscricaoPush(inscricao: InscricaoPush) {
  if (!inscricao?.endpoint || !inscricao.chaves?.auth) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("inscricoes_push").upsert(
    {
      usuario_id: user.id,
      endpoint: inscricao.endpoint,
      chaves: inscricao.chaves,
    },
    { onConflict: "endpoint" },
  );
}

export async function removerInscricaoPush(endpoint: string) {
  if (!endpoint) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("inscricoes_push")
    .delete()
    .eq("usuario_id", user.id)
    .eq("endpoint", endpoint);
}
