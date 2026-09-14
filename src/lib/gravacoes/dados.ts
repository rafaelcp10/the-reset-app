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

  // Uma chamada para todas as gravações, não uma por gravação: com as
  // cinco frases gravadas eram cinco idas ao Storage só para montar a tela.
  const { data: assinadas } = await supabase.storage
    .from(BUCKET_GRAVACOES)
    .createSignedUrls(
      linhas.map((linha) => linha.caminho as string),
      VALIDADE_URL_SEGUNDOS,
    );

  const urlPorCaminho = new Map(
    (assinadas ?? []).map((a) => [a.path, a.signedUrl ?? null]),
  );

  return {
    ...VAZIO(),
    ...Object.fromEntries(
      linhas.map((linha) => [
        linha.funcao as Funcao,
        urlPorCaminho.get(linha.caminho as string) ?? null,
      ]),
    ),
  };
}
