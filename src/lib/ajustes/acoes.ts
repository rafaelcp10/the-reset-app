"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const CAMINHO = "/ajustes";

export async function salvarLembreteAtivo(ativo: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("usuarios").update({ lembrete_ativo: ativo }).eq("id", user.id);
  revalidatePath(CAMINHO);
}

export async function salvarHorarioAjustes(horario: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("usuarios").update({ horario_checkin: horario }).eq("id", user.id);
  revalidatePath(CAMINHO);
}
