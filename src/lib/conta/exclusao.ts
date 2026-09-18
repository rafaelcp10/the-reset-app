"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_GRAVACOES } from "@/lib/gravacoes/dados";
import { BUCKET_FOTOS } from "@/lib/saude/fotos";

/**
 * Apaga a conta e tudo que está nela.
 *
 * A política de privacidade promete isso, então precisa existir de fato —
 * e precisa ser completo: as tabelas caem por cascata a partir de
 * auth.users, mas os arquivos no Storage não, e ficariam órfãos para
 * sempre. São os dois dados mais sensíveis do app: a voz da pessoa e a
 * foto do corpo dela.
 */
export async function apagarConta(confirmacao: string) {
  // Uma barreira deliberada: exclusão não pode acontecer por toque errado.
  if (confirmacao.trim().toUpperCase() !== "APAGAR") {
    return { erro: 'Escreva APAGAR para confirmar.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Primeiro os arquivos: se a conta sumisse antes, perderíamos o caminho
  // até eles e ficariam no bucket sem dono.
  const [{ data: gravacoes }, { data: fotos }] = await Promise.all([
    admin.from("gravacoes").select("caminho").eq("usuario_id", user.id),
    admin.from("fotos_evolucao").select("caminho").eq("usuario_id", user.id),
  ]);

  const caminhos = (gravacoes ?? [])
    .map((g) => g.caminho as string)
    .filter(Boolean);

  const caminhosFotos = (fotos ?? [])
    .map((f) => f.caminho as string)
    .filter(Boolean);

  if (caminhos.length > 0) {
    await admin.storage.from(BUCKET_GRAVACOES).remove(caminhos);
  }

  if (caminhosFotos.length > 0) {
    await admin.storage.from(BUCKET_FOTOS).remove(caminhosFotos);
  }

  // Remover o usuário do auth derruba `usuarios` e, em cascata, frases,
  // dias, tarefas, compromissos, músicas, gravações, medidas, fotos e
  // inscrições de push.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { erro: "Não deu para apagar agora. Tenta de novo em instantes." };
  }

  await supabase.auth.signOut();
  redirect("/login?conta=apagada");
}
