"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FUNCOES, type Funcao } from "@/lib/frases/modelo";
import { BUCKET_GRAVACOES } from "./dados";

/** 30s cobre qualquer uma das cinco frases lidas devagar. */
const TAMANHO_MAXIMO_BYTES = 2 * 1024 * 1024;

const EXTENSOES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/aac": "aac",
  "audio/wav": "wav",
};

function extensaoDe(mime: string) {
  return EXTENSOES[mime.split(";")[0].trim()] ?? "webm";
}

export async function salvarGravacao(
  funcao: Funcao,
  caminhoAtual: string,
  formData: FormData,
) {
  if (!FUNCOES.includes(funcao)) return;

  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) return;
  if (audio.size > TAMANHO_MAXIMO_BYTES) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const mime = audio.type || "audio/webm";
  const caminho = `${user.id}/${funcao}.${extensaoDe(mime)}`;

  const { error } = await supabase.storage
    .from(BUCKET_GRAVACOES)
    .upload(caminho, audio, { contentType: mime, upsert: true });
  if (error) throw new Error("upload falhou");

  // A extensão pode mudar entre aparelhos (webm no Android, m4a no iPhone).
  // Se mudou, o arquivo antigo do mesmo usuário/função vira lixo — remove.
  const { data: anterior } = await supabase
    .from("gravacoes")
    .select("caminho")
    .eq("usuario_id", user.id)
    .eq("funcao", funcao)
    .maybeSingle();

  if (anterior?.caminho && anterior.caminho !== caminho) {
    await supabase.storage
      .from(BUCKET_GRAVACOES)
      .remove([anterior.caminho as string]);
  }

  await supabase.from("gravacoes").upsert(
    { usuario_id: user.id, funcao, caminho, mime },
    { onConflict: "usuario_id,funcao" },
  );

  revalidatePath(caminhoAtual);
}

export async function apagarGravacao(funcao: Funcao, caminhoAtual: string) {
  if (!FUNCOES.includes(funcao)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: atual } = await supabase
    .from("gravacoes")
    .select("caminho")
    .eq("usuario_id", user.id)
    .eq("funcao", funcao)
    .maybeSingle();

  if (atual?.caminho) {
    await supabase.storage
      .from(BUCKET_GRAVACOES)
      .remove([atual.caminho as string]);
  }

  await supabase
    .from("gravacoes")
    .delete()
    .eq("usuario_id", user.id)
    .eq("funcao", funcao);

  revalidatePath(caminhoAtual);
}
