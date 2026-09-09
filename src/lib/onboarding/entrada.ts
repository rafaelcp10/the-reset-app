import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Diz se a pessoa ainda não passou pelo onboarding.
 *
 * O sinal é a palavra da frase 1: ela é o único campo obrigatório do app
 * inteiro, e não existe jeito de apagá-la depois. Se está vazia, aquela
 * conta nunca foi conduzida — é gente que caiu direto no Ritual com as
 * cinco frases padrão, sem nunca ter escolhido nada.
 */
export async function precisaDeOnboarding(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("frases")
    .select("preenchimento_lacuna")
    .eq("usuario_id", usuarioId)
    .eq("funcao", "identidade")
    .order("versao", { ascending: false })
    .limit(1);

  // Na dúvida, não interrompe quem já está usando o app.
  if (error) return false;

  const palavra = data?.[0]?.preenchimento_lacuna as string | null | undefined;
  return !palavra || palavra.trim() === "";
}
