"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKET_GRAVACOES } from "@/lib/gravacoes/dados";

/**
 * Apaga a conta e tudo que está nela.
 *
 * A política de privacidade promete isso, então precisa existir de fato —
 * e precisa ser completo: as tabelas caem por cascata a partir de
 * auth.users, mas os arquivos de áudio no Storage não, e ficariam órfãos
 * para sempre. A voz da pessoa é o dado mais sensível aqui.
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

  // Primeiro os áudios: se a conta sumisse antes, perderíamos o caminho
  // até eles e os arquivos ficariam no bucket sem dono.
  const { data: gravacoes } = await admin
    .from("gravacoes")
    .select("caminho")
    .eq("usuario_id", user.id);

  const caminhos = (gravacoes ?? [])
    .map((g) => g.caminho as string)
    .filter(Boolean);

  if (caminhos.length > 0) {
    await admin.storage.from(BUCKET_GRAVACOES).remove(caminhos);
  }

  // Remover o usuário do auth derruba `usuarios` e, em cascata, frases,
  // dias, tarefas, compromissos, músicas, gravações e inscrições de push.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { erro: "Não deu para apagar agora. Tenta de novo em instantes." };
  }

  await supabase.auth.signOut();
  redirect("/login?conta=apagada");
}
