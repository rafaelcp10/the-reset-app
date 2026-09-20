"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Normaliza o que a pessoa colou.
 *
 * O botão de compartilhar do Spotify devolve coisas diferentes conforme o
 * aparelho: `https://open.spotify.com/track/ID?si=...`, `spotify:track:ID`,
 * às vezes com `/intl-pt/` no meio. Tudo vira a mesma URL canônica — sem
 * o `?si=`, que é um identificador de quem compartilhou e não tem por que
 * ficar guardado.
 */
function normalizarLink(bruto: string): string | null {
  const texto = bruto.trim();
  if (!texto) return null;

  const uri = texto.match(/^spotify:(track|album|playlist|episode):([\w]+)$/);
  if (uri) return `https://open.spotify.com/${uri[1]}/${uri[2]}`;

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }

  if (!/(^|\.)spotify\.com$/.test(url.hostname)) {
    // Qualquer outro serviço também serve: o app só guarda e abre. Mas
    // precisa ser endereço de verdade, e não texto solto.
    return url.protocol === "https:" ? url.toString() : null;
  }

  const caminho = url.pathname.replace(/^\/intl-[a-z-]+/, "");
  const faixa = caminho.match(/^\/(track|album|playlist|episode)\/([\w]+)/);
  if (!faixa) return null;

  return `https://open.spotify.com/${faixa[1]}/${faixa[2]}`;
}

/**
 * O nome da música, sem API e sem conta.
 *
 * O oEmbed do Spotify é público: devolve o título de qualquer link sem
 * autenticação nenhuma. É o que permite a pessoa colar só o link e ver o
 * nome certo na lista, em vez de digitar.
 *
 * Se falhar, a música é salva mesmo assim e a lista mostra o link — pior,
 * e melhor do que recusar o que a pessoa colou.
 */
async function buscarNome(url: string): Promise<string | null> {
  if (!url.startsWith("https://open.spotify.com/")) return null;
  try {
    const resposta = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!resposta.ok) return null;
    const dados = (await resposta.json()) as { title?: string };
    const titulo = dados.title?.trim();
    return titulo ? titulo.slice(0, 200) : null;
  } catch {
    return null;
  }
}

/** Define a faixa de um slot (0 a 4) — até 5 músicas por usuário. */
export async function salvarFaixaSlot(
  caminhoAtual: string,
  ordem: number,
  formData: FormData,
) {
  const url = normalizarLink((formData.get("url") as string) ?? "");
  if (!url) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const nome = await buscarNome(url);

  await supabase.from("musicas").upsert(
    { usuario_id: user.id, url, nome, ordem },
    { onConflict: "usuario_id,ordem" },
  );

  revalidatePath(caminhoAtual);
  revalidatePath("/ritual/espelho");
}

/** Remove a faixa de um slot, liberando-o. */
export async function removerFaixaSlot(caminhoAtual: string, ordem: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("musicas")
    .delete()
    .eq("usuario_id", user.id)
    .eq("ordem", ordem);

  revalidatePath(caminhoAtual);
  revalidatePath("/ritual/espelho");
}
