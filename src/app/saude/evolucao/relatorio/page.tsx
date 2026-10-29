import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { buscarRelatorio } from "@/lib/saude/relatorio";
import ConteudoRelatorio from "./ConteudoRelatorio";

/**
 * O relatório de progressão do mês.
 *
 * Abre no mês em curso ("outubro, até agora"), e as setas andam para os
 * meses anteriores. Tudo descreve o que aconteceu, comparado com o mês
 * anterior da própria pessoa, sem cor pela direção e sem seta de veredito.
 *
 * As dicas são a exceção aberta em 2026-10-29: o app sugere método de
 * treino aqui, e só aqui (ver CLAUDE.md, "Dicas de treinador no
 * relatório"). O âmbar da tela é o botão de baixar o PDF.
 */
export default async function RelatorioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ mes: pedido }, { data: usuario }] = await Promise.all([
    searchParams,
    supabase.from("usuarios").select("*").eq("id", user.id).maybeSingle(),
  ]);
  const hoje = dataRitual(agoraNoFuso((usuario?.fuso as string) || "UTC"));
  const atual = hoje.slice(0, 7);
  // Mês no futuro, ou escrito errado na URL, vira o mês de agora.
  const mes = pedido && /^\d{4}-\d{2}$/.test(pedido) && pedido <= atual ? pedido : atual;

  const r = await buscarRelatorio(supabase, user.id, mes, hoje);
  return <ConteudoRelatorio r={r} atual={atual} />;
}
