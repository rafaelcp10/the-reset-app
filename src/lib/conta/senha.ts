"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EstadoConta = { erro?: string; aviso?: string };

const MINIMO_SENHA = 8;

/**
 * Converte a conta anônima atual numa conta com e-mail e senha.
 *
 * Converter em vez de criar do zero é o ponto: a pessoa acabou de passar
 * pelo onboarding e escolher a palavra da frase 1. Criar conta nova aqui
 * jogaria isso fora e ela recomeçaria sem entender por quê.
 *
 * Senha em vez de link mágico porque o link abre no navegador e chuta a
 * pessoa para fora do app instalado.
 */
export async function criarConta(
  _anterior: EstadoConta,
  formData: FormData,
): Promise<EstadoConta> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const senha = (formData.get("senha") as string) ?? "";

  if (!email.includes("@")) return { erro: "Digite um e-mail válido." };
  if (senha.length < MINIMO_SENHA) {
    return { erro: `A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ email, password: senha });

  if (error) {
    const jaExiste = /already|registered|exists/i.test(error.message);
    return {
      erro: jaExiste
        ? "Esse e-mail já tem conta. Entre por ela em vez de criar outra."
        : "Não deu para criar a conta agora. Tenta de novo.",
    };
  }

  await supabase
    .from("usuarios")
    .update({ email })
    .eq("id", user.id);

  redirect("/onboarding/perfil");
}

export async function entrarComSenha(
  _anterior: EstadoConta,
  formData: FormData,
): Promise<EstadoConta> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const senha = (formData.get("senha") as string) ?? "";

  if (!email || !senha) return { erro: "Preencha e-mail e senha." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { erro: "E-mail ou senha não conferem." };
  }

  redirect("/ritual");
}

/** Envia o link de redefinição. */
export async function pedirRecuperacao(
  _anterior: EstadoConta,
  formData: FormData,
): Promise<EstadoConta> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { erro: "Digite um e-mail válido." };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/recuperar`,
  });

  if (error) return { erro: "Não deu para enviar agora. Tenta de novo." };

  // Sem confirmar se o e-mail existe: dizer isso entregaria quem tem conta.
  return { aviso: "Se existe conta com esse e-mail, o link já foi enviado." };
}

/** Define a nova senha, já dentro da sessão aberta pelo link. */
export async function redefinirSenha(
  _anterior: EstadoConta,
  formData: FormData,
): Promise<EstadoConta> {
  const senha = (formData.get("senha") as string) ?? "";
  if (senha.length < MINIMO_SENHA) {
    return { erro: `A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "O link expirou. Peça outro." };

  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: "Não deu para trocar a senha. Tenta de novo." };

  redirect("/ritual");
}
