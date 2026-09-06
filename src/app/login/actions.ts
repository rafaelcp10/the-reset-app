"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type EstadoLogin = {
  status: "idle" | "enviado" | "erro";
  mensagem?: string;
};

export async function enviarLinkMagico(
  _estadoAnterior: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = ((formData.get("email") as string) ?? "").trim();

  if (!email) {
    return { status: "erro", mensagem: "Digite seu e-mail para continuar." };
  }

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    return {
      status: "erro",
      mensagem: "Não conseguimos enviar o link agora. Tenta de novo em instantes.",
    };
  }

  return { status: "enviado" };
}
