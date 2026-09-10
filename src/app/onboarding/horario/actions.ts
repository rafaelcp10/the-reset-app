"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoHorario = { erro?: string };

export async function salvarHorario(
  _estadoAnterior: EstadoHorario,
  formData: FormData,
): Promise<EstadoHorario> {
  const horario = (formData.get("horario") as string) ?? "";
  const fuso = (formData.get("fuso") as string) || null;

  if (!/^\d{2}:\d{2}$/.test(horario)) {
    return { erro: "Escolha um horário para continuar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("usuarios")
    .update({ horario_checkin: horario, fuso })
    .eq("id", user.id);

  if (error) {
    return { erro: "Não deu para salvar o horário. Tenta de novo." };
  }

  redirect("/onboarding/conta");
}
