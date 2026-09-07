"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Salva/atualiza a linha do dia — nunca mexe em `feito`. */
export async function salvarLinhaHoje(
  caminhoAtual: string,
  data: string,
  formData: FormData,
) {
  const linha = ((formData.get("linha") as string) ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("dias")
    .upsert(
      { usuario_id: user.id, data, linha_do_dia: linha || null },
      { onConflict: "usuario_id,data" },
    );

  revalidatePath(caminhoAtual);
}

/**
 * Confirma o dia (Fiz / Não fiz) — nunca mexe em `linha_do_dia`. "Não fiz" é
 * um registro tão válido quanto "fiz" (ver CLAUDE.md: falhar não zera nada).
 */
export async function confirmarDia(
  caminhoAtual: string,
  data: string,
  feito: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("dias").upsert(
    {
      usuario_id: user.id,
      data,
      feito,
      registrado_em: new Date().toISOString(),
    },
    { onConflict: "usuario_id,data" },
  );

  revalidatePath(caminhoAtual);
}

/** Marca um inegociável no dia — alterna entre feito e não feito. */
export async function marcarCompromissoDia(
  caminhoAtual: string,
  compromissoId: string,
  data: string,
  proximoFeito: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("compromissos_dia").upsert(
    {
      usuario_id: user.id,
      compromisso_id: compromissoId,
      data,
      feito: proximoFeito,
    },
    { onConflict: "compromisso_id,data" },
  );

  revalidatePath(caminhoAtual);
}

/**
 * Define ou edita o inegociável de um slot (0, 1 ou 2) da semana. Sair do
 * campo vazio apaga o slot — é assim que se "limpa" um inegociável, sem
 * precisar de um botão de remover separado.
 */
export async function salvarCompromissoSlot(
  caminhoAtual: string,
  semanaInicio: string,
  ordem: number,
  formData: FormData,
) {
  const texto = ((formData.get("texto") as string) ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!texto) {
    await supabase
      .from("compromissos")
      .delete()
      .eq("usuario_id", user.id)
      .eq("semana_inicio", semanaInicio)
      .eq("ordem", ordem);
    revalidatePath(caminhoAtual);
    return;
  }

  await supabase.from("compromissos").upsert(
    { usuario_id: user.id, semana_inicio: semanaInicio, ordem, texto },
    { onConflict: "usuario_id,semana_inicio,ordem" },
  );

  revalidatePath(caminhoAtual);
}

/** Preferências do modo espelho — repetições por frase e mãos livres. */
export async function salvarPreferenciasRitual(
  repsPadrao: number,
  modoMaosLivres: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("usuarios")
    .update({ reps_padrao: repsPadrao, modo_maos_livres: modoMaosLivres })
    .eq("id", user.id);
}

/**
 * Marca que o Espelho de hoje (respiração + 5 frases) foi concluído — um
 * evento distinto da confirmação noturna — e volta para o Ritual com a
 * linha de hoje em foco.
 */
export async function concluirEspelho(data: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("dias")
    .upsert(
      { usuario_id: user.id, data, espelho_feito_em: new Date().toISOString() },
      { onConflict: "usuario_id,data" },
    );

  redirect("/ritual?foco=linha");
}
