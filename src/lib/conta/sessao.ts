"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Sair da conta neste aparelho.
 *
 * Não apaga nada: as frases, as gravações e o histórico continuam na
 * conta, e voltam inteiros no próximo login. É por isso que fica longe de
 * "apagar minha conta", que é o botão vizinho e faz o oposto.
 */
export async function sairDaConta() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
