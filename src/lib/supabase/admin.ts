import { createClient as criarClienteBase } from "@supabase/supabase-js";

/**
 * Cliente com a chave de serviço — ignora RLS. Só para rotinas de
 * servidor que precisam varrer vários usuários (o cron do check-in).
 * Nunca deve ser importado por código que roda no navegador.
 */
export function createAdminClient() {
  return criarClienteBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
