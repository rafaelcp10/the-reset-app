"use client";

import { createClient } from "@/lib/supabase/client";

export type ResultadoGoogle = { erro: string } | null;

function destino(caminho: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(caminho)}`;
}

/**
 * Entrar com o Google. Usado por quem chega num aparelho novo e quer a
 * conta de volta — não depende de configuração extra no Supabase.
 */
export async function entrarComGoogle(proximaRota = "/ritual"): Promise<ResultadoGoogle> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: destino(proximaRota) },
  });

  if (error) {
    return { erro: "Não deu para abrir o Google agora. Tenta de novo." };
  }
  return null;
}

/**
 * Gruda o Google na conta anônima que já existe, preservando tudo que foi
 * escrito. Depende de o projeto permitir vínculo manual de identidade; se
 * não permitir, o Supabase devolve erro e não criamos conta nova por
 * baixo dos panos — perder o histórico seria pior que não vincular.
 */
export async function vincularGoogle(): Promise<ResultadoGoogle> {
  const supabase = createClient();
  const { error } = await supabase.auth.linkIdentity({
    provider: "google",
    options: { redirectTo: destino("/ajustes") },
  });

  if (!error) return null;

  const desabilitado = /manual linking|not enabled|disabled/i.test(error.message);
  return {
    erro: desabilitado
      ? "O vínculo de conta está desligado no servidor. Use o e-mail por enquanto."
      : "Não deu para vincular agora. Tenta de novo.",
  };
}
