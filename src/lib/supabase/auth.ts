import type { SupabaseClient } from "@supabase/supabase-js";

export type UsuarioDaSessao = {
  id: string;
  email: string | null;
  is_anonymous: boolean;
};

/**
 * Quem está logado, conferido aqui mesmo e não no servidor de autenticação.
 *
 * `getUser()` é uma ida ao Supabase Auth pela rede, e era chamado duas vezes
 * em toda navegação — no proxy e na tela — antes de qualquer dado sair do
 * banco. O projeto assina os tokens com chave assimétrica (ES256), então
 * `getClaims()` confere a assinatura com a chave pública, que fica em
 * memória: sem ida nenhuma depois da primeira.
 *
 * Não muda quem enxerga o quê: o banco confere o mesmo token, e é o RLS que
 * separa os dados de cada pessoa. O que se perde é só saber, antes do token
 * vencer (uma hora), que a sessão foi encerrada em outro aparelho — por isso
 * as telas e ações da própria conta (senha, e-mail, apagar a conta)
 * continuam com `getUser()`.
 */
export async function usuarioDaSessao(supabase: SupabaseClient): Promise<UsuarioDaSessao | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" && claims.email ? claims.email : null,
    is_anonymous: claims.is_anonymous === true,
  };
}
