"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoVinculo = {
  status: "idle" | "enviado" | "erro";
  mensagem?: string;
};

/**
 * Prende a conta anônima a um e-mail. Enquanto isso não acontece, tudo que
 * a pessoa escreveu vive só nos cookies daquele navegador — limpar os
 * dados ou trocar de aparelho apaga o histórico inteiro, sem aviso.
 *
 * O e-mail só passa a valer depois que a pessoa confirma pelo link, então
 * digitar errado não tranca ninguém para fora.
 */
export async function vincularEmail(
  _anterior: EstadoVinculo,
  formData: FormData,
): Promise<EstadoVinculo> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { status: "erro", mensagem: "Digite um e-mail válido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const origin = (await headers()).get("origin");
  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/callback?next=/ajustes` },
  );

  if (error) {
    const jaUsado = /already|registered|exists/i.test(error.message);
    return {
      status: "erro",
      mensagem: jaUsado
        ? "Esse e-mail já está em outra conta. Entre por ela em vez de vincular aqui."
        : "Não deu para enviar agora. Tenta de novo em instantes.",
    };
  }

  revalidatePath("/ajustes");
  return { status: "enviado" };
}
