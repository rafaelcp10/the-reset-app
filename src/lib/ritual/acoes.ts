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
 * Define ou edita o inegociável de um slot (0, 1 ou 2) da semana. O
 * atributo `required` do input já impede envio vazio — a checagem aqui é
 * só uma segunda trava, sem mensagem de erro na tela.
 */
export async function salvarCompromissoSlot(
  caminhoAtual: string,
  semanaInicio: string,
  ordem: number,
  formData: FormData,
) {
  const texto = ((formData.get("texto") as string) ?? "").trim();
  if (!texto) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("compromissos").upsert(
    { usuario_id: user.id, semana_inicio: semanaInicio, ordem, texto },
    { onConflict: "usuario_id,semana_inicio,ordem" },
  );

  revalidatePath(caminhoAtual);
}

/** Define a música do ritual — só existe uma faixa por vez, então troca a anterior. */
export async function definirMusica(caminhoAtual: string, formData: FormData) {
  const url = ((formData.get("url") as string) ?? "").trim();
  if (!url) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("musicas").delete().eq("usuario_id", user.id);
  await supabase.from("musicas").insert({ usuario_id: user.id, url, ordem: 0 });

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

/** Encerramento do espelho: salva a linha do dia e volta para o ritual. */
export async function concluirEspelho(data: string, formData: FormData) {
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

  redirect("/ritual");
}
