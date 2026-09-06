import type { SupabaseClient, User } from "@supabase/supabase-js";
import { FRASES_PADRAO, FUNCOES, type Funcao, type FraseRow } from "./modelo";

/**
 * Garante que exista uma linha em `usuarios` e uma versão 1 de cada uma das
 * 5 frases para o usuário autenticado. Idempotente — chamada toda vez que o
 * onboarding é aberto.
 */
export async function garantirUsuarioEFrasesPadrao(
  supabase: SupabaseClient,
  user: User,
) {
  await supabase
    .from("usuarios")
    .upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id" });

  const { data: existentes } = await supabase
    .from("frases")
    .select("funcao")
    .eq("usuario_id", user.id);

  const funcoesExistentes = new Set((existentes ?? []).map((f) => f.funcao));
  const faltando = FUNCOES.filter((funcao) => !funcoesExistentes.has(funcao));

  if (faltando.length === 0) return;

  await supabase.from("frases").insert(
    faltando.map((funcao) => ({
      usuario_id: user.id,
      funcao,
      texto: FRASES_PADRAO[funcao].texto,
      preenchimento_lacuna: null,
      versao: 1,
    })),
  );
}

/** Última versão de cada uma das 5 frases do usuário. */
export async function buscarFrasesAtuais(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<Record<Funcao, FraseRow>> {
  const { data, error } = await supabase
    .from("frases")
    .select("*")
    .eq("usuario_id", usuarioId)
    .order("versao", { ascending: false });

  if (error) throw error;

  const atuais = {} as Record<Funcao, FraseRow>;
  for (const linha of (data ?? []) as FraseRow[]) {
    if (!atuais[linha.funcao]) atuais[linha.funcao] = linha;
  }
  return atuais;
}

/**
 * Cria uma nova versão da frase — nunca atualiza a linha existente, para que
 * as versões anteriores permaneçam no histórico.
 */
export async function inserirNovaVersaoFrase(
  supabase: SupabaseClient,
  usuarioId: string,
  funcao: Funcao,
  texto: string,
  preenchimentoLacuna: string | null,
) {
  const { data: atual } = await supabase
    .from("frases")
    .select("versao")
    .eq("usuario_id", usuarioId)
    .eq("funcao", funcao)
    .order("versao", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("frases").insert({
    usuario_id: usuarioId,
    funcao,
    texto,
    preenchimento_lacuna: preenchimentoLacuna,
    versao: (atual?.versao ?? 0) + 1,
  });

  if (error) throw error;
}
