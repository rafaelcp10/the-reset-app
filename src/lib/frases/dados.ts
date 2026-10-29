import type { SupabaseClient } from "@supabase/supabase-js";
import { FRASES_PADRAO, FUNCOES, type Funcao, type FraseRow } from "./modelo";

/**
 * Garante que exista uma linha em `usuarios` e uma versão 1 de cada uma das
 * 5 frases para o usuário autenticado. Idempotente — chamada toda vez que o
 * onboarding é aberto, e nas telas principais.
 *
 * **Lê antes de escrever.** Até 2026-10-29 ela gravava a linha de `usuarios`
 * em toda abertura de Home, Ritual, To-do e Saúde — um `upsert` que
 * reescrevia o e-mail, que nada no app lê. Agora uma consulta só resolve o
 * caso comum: frase existente garante a linha de `usuarios` (a chave
 * estrangeira não deixa uma existir sem a outra), e as cinco presentes
 * querem dizer que não há nada a fazer. Escrever fica para quem é novo.
 */
export async function garantirUsuarioEFrasesPadrao(
  supabase: SupabaseClient,
  user: { id: string; email?: string | null },
) {
  const { data: existentes } = await supabase
    .from("frases")
    .select("funcao")
    .eq("usuario_id", user.id);

  const funcoesExistentes = new Set((existentes ?? []).map((f) => f.funcao));
  const faltando = FUNCOES.filter((funcao) => !funcoesExistentes.has(funcao));

  if (faltando.length === 0) return;

  // A linha de `usuarios` antes das frases: elas apontam para ela.
  await supabase
    .from("usuarios")
    .upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id", ignoreDuplicates: true });

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
