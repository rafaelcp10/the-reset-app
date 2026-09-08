import type { SupabaseClient } from "@supabase/supabase-js";
import { FUNCOES, type Funcao } from "@/lib/frases/modelo";

export const BUCKET_GRAVACOES = "gravacoes";

/** Validade da URL assinada. Curta: o áudio é pessoal e não deve circular. */
const VALIDADE_URL_SEGUNDOS = 60 * 60;

export type GravacoesPorFuncao = Record<Funcao, string | null>;

const VAZIO = () =>
  Object.fromEntries(FUNCOES.map((f) => [f, null])) as GravacoesPorFuncao;

/** URL assinada da gravação de cada frase, ou null quando não há gravação. */
export async function buscarGravacoes(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<GravacoesPorFuncao> {
  const { data } = await supabase
    .from("gravacoes")
    .select("funcao, caminho")
    .eq("usuario_id", usuarioId);

  const linhas = data ?? [];
  if (linhas.length === 0) return VAZIO();

  const assinadas = await Promise.all(
    linhas.map(async (linha) => {
      const { data: assinada } = await supabase.storage
        .from(BUCKET_GRAVACOES)
        .createSignedUrl(linha.caminho as string, VALIDADE_URL_SEGUNDOS);
      return [linha.funcao as Funcao, assinada?.signedUrl ?? null] as const;
    }),
  );

  return { ...VAZIO(), ...Object.fromEntries(assinadas) };
}
