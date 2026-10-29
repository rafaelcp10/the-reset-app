"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/supabase/auth";

/** Salva "como eu estou hoje" e fecha a semana passada. */
export async function fecharSemana(
  semanaPassadaInicio: string,
  formData: FormData,
) {
  const comoEstou = ((formData.get("comoEstou") as string) ?? "").trim();

  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) redirect("/login");

  await supabase.from("revisoes_semanais").upsert(
    {
      usuario_id: user.id,
      semana_inicio: semanaPassadaInicio,
      como_estou: comoEstou || null,
    },
    { onConflict: "usuario_id,semana_inicio" },
  );

  redirect("/ritual");
}
