import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_FOTOS = "fotos-evolucao";

/**
 * Validade da URL assinada.
 *
 * Curta de propósito: uma URL de foto de corpo que vaza não deve continuar
 * servindo a foto meia hora depois. Quinze minutos cobrem a visita à tela,
 * e a imagem já carregada no navegador não some quando o link expira — a
 * próxima abertura da página assina de novo.
 */
const VALIDADE_URL_SEGUNDOS = 15 * 60;

export type Foto = {
  id: string;
  data: string;
  url: string | null;
};

export type ParDeFotos = {
  antes: Foto | null;
  depois: Foto | null;
  /** Quantas existem ao todo, incluindo as do meio que a tela não mostra. */
  total: number;
  /** A de hoje, quando existe — é a que pode ser trocada ou apagada. */
  hoje: Foto | null;
};

/**
 * A primeira e a mais recente.
 *
 * As do meio continuam guardadas e continuam virando "depois" enquanto são
 * a última. A tela mostra duas porque a pergunta que ela responde tem duas
 * pontas; uma galeria completa entra se alguém pedir.
 */
export async function buscarParDeFotos(
  supabase: SupabaseClient,
  usuarioId: string,
  hoje: string,
): Promise<ParDeFotos> {
  const { data } = await supabase
    .from("fotos_evolucao")
    .select("id, data, caminho")
    .eq("usuario_id", usuarioId)
    .order("data", { ascending: true });

  const linhas = (data ?? []) as { id: string; data: string; caminho: string }[];
  if (linhas.length === 0) {
    return { antes: null, depois: null, total: 0, hoje: null };
  }

  const primeira = linhas[0];
  const ultima = linhas[linhas.length - 1];
  const daquiHoje = linhas.find((l) => l.data === hoje) ?? null;

  // Uma chamada só para os caminhos distintos: com uma foto só, primeira e
  // última são a mesma linha, e assinar duas vezes seria ida dobrada.
  const caminhos = [
    ...new Set(
      [primeira, ultima, daquiHoje]
        .filter((l): l is NonNullable<typeof l> => Boolean(l))
        .map((l) => l.caminho),
    ),
  ];

  const { data: assinadas } = await supabase.storage
    .from(BUCKET_FOTOS)
    .createSignedUrls(caminhos, VALIDADE_URL_SEGUNDOS);

  const urlPor = new Map(
    (assinadas ?? []).map((a) => [a.path, a.signedUrl ?? null]),
  );

  const montar = (linha: typeof primeira | null): Foto | null =>
    linha
      ? { id: linha.id, data: linha.data, url: urlPor.get(linha.caminho) ?? null }
      : null;

  return {
    antes: montar(primeira),
    // Com uma foto só não existe "depois": existe um começo.
    depois: linhas.length > 1 ? montar(ultima) : null,
    total: linhas.length,
    hoje: montar(daquiHoje),
  };
}
