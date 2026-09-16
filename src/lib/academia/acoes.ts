"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GRUPOS, type GrupoMuscular } from "./catalogo";
import { LIMITACOES, LOCAIS, type LocalTreino } from "./dados";

const CAMINHO = "/academia";

async function usuarioAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type EstadoConfig = { erro?: string };

/**
 * As cinco perguntas. Nenhuma é obrigatória a não ser o local: o resto
 * ajusta o que o app mostra, e ninguém deve ser barrado da aba por não
 * querer declarar quanto tempo tem.
 */
export async function salvarConfigAcademia(
  _anterior: EstadoConfig,
  formData: FormData,
): Promise<EstadoConfig> {
  const local = (formData.get("local") as string) ?? "";
  if (!LOCAIS.includes(local as LocalTreino)) {
    return { erro: "Escolha onde você treina." };
  }

  const minutosBruto = Number(formData.get("minutos"));
  const minutos = Number.isFinite(minutosBruto) && minutosBruto > 0 ? minutosBruto : null;

  const limitacoes = formData
    .getAll("limitacoes")
    .map(String)
    .filter((l) => (LIMITACOES as readonly string[]).includes(l));

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("usuarios")
    .update({
      treino_local: local,
      treino_minutos: minutos,
      treino_limitacoes: limitacoes,
      academia_configurada_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect(CAMINHO);
}

export async function criarTreino(formData: FormData) {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  if (!nome) return;

  const { supabase, user } = await usuarioAtual();
  const { count } = await supabase
    .from("treinos")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id);

  await supabase
    .from("treinos")
    .insert({ usuario_id: user.id, nome, ordem: count ?? 0 });

  revalidatePath(CAMINHO);
}

export async function salvarNomeTreino(treinoId: string, formData: FormData) {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  if (!nome) return;

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("treinos")
    .update({ nome })
    .eq("usuario_id", user.id)
    .eq("id", treinoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
  revalidatePath(CAMINHO);
}

export async function salvarDiasTreino(treinoId: string, dias: number[]) {
  const limpos = [...new Set(dias)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("treinos")
    .update({ dias_semana: limpos })
    .eq("usuario_id", user.id)
    .eq("id", treinoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
  revalidatePath(CAMINHO);
}

export async function excluirTreino(treinoId: string) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("treinos")
    .delete()
    .eq("usuario_id", user.id)
    .eq("id", treinoId);

  revalidatePath(CAMINHO);
  redirect(CAMINHO);
}

/**
 * Adiciona o exercício. `grupo` e `degrau` chegam preenchidos quando o nome
 * veio do catálogo, e vazios quando a pessoa escreveu o dela — nesse caso o
 * app não adivinha: fica sem grupo, e o degrau é o padrão de barra.
 */
export async function adicionarExercicio(treinoId: string, formData: FormData) {
  const nome = ((formData.get("nome") as string) ?? "").trim();
  if (!nome) return;

  const grupoBruto = ((formData.get("grupo") as string) ?? "").trim();
  const grupo = GRUPOS.includes(grupoBruto as GrupoMuscular)
    ? (grupoBruto as GrupoMuscular)
    : null;

  const degrauBruto = Number(formData.get("degrau"));
  const degrau =
    Number.isFinite(degrauBruto) && degrauBruto >= 0 ? degrauBruto : 2.5;

  const { supabase, user } = await usuarioAtual();
  const { count } = await supabase
    .from("exercicios")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", user.id)
    .eq("treino_id", treinoId);

  await supabase.from("exercicios").insert({
    usuario_id: user.id,
    treino_id: treinoId,
    nome,
    grupo,
    incremento_kg: degrau,
    ordem: count ?? 0,
  });

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
}

export async function salvarExercicio(
  exercicioId: string,
  treinoId: string,
  campos: { series: number; repeticoes: number; incremento_kg: number },
) {
  const series = Math.min(Math.max(Math.round(campos.series), 1), 20);
  const repeticoes = Math.min(Math.max(Math.round(campos.repeticoes), 1), 100);
  const incremento =
    Number.isFinite(campos.incremento_kg) && campos.incremento_kg >= 0
      ? Math.min(campos.incremento_kg, 50)
      : 2.5;

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("exercicios")
    .update({ series, repeticoes, incremento_kg: incremento })
    .eq("usuario_id", user.id)
    .eq("id", exercicioId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
}

export async function excluirExercicio(exercicioId: string, treinoId: string) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("exercicios")
    .delete()
    .eq("usuario_id", user.id)
    .eq("id", exercicioId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}`);
}

/**
 * Grava o que foi levantado hoje.
 *
 * Uma linha por exercício por dia: registrar de novo no mesmo dia corrige
 * o registro, não empilha um segundo. Corrigir para menos entra em
 * silêncio — sem alerta, sem cor, sem "você regrediu" —, porque é isso que
 * vira a base do próximo degrau.
 */
export async function registrarSerie(
  exercicioId: string,
  treinoId: string,
  data: string,
  valores: { carga: number | null; repeticoes: number; series: number },
) {
  const { supabase, user } = await usuarioAtual();

  const carga =
    valores.carga !== null && Number.isFinite(valores.carga) && valores.carga >= 0
      ? Math.min(valores.carga, 1000)
      : null;
  const repeticoes = Math.min(Math.max(Math.round(valores.repeticoes), 1), 100);
  const series = Math.min(Math.max(Math.round(valores.series), 1), 20);

  await supabase.from("registros_exercicio").upsert(
    {
      usuario_id: user.id,
      exercicio_id: exercicioId,
      data,
      carga_kg: carga,
      repeticoes,
      series,
    },
    { onConflict: "exercicio_id,data" },
  );

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(`${CAMINHO}/exercicios/${exercicioId}`);
}

/** Desfaz o registro de hoje. Erro de dedo acontece. */
export async function apagarRegistro(
  exercicioId: string,
  treinoId: string,
  data: string,
) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("registros_exercicio")
    .delete()
    .eq("usuario_id", user.id)
    .eq("exercicio_id", exercicioId)
    .eq("data", data);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(`${CAMINHO}/exercicios/${exercicioId}`);
}

/**
 * Começa o treino e liga o cronômetro.
 *
 * Se já havia uma sessão aberta, ela é fechada antes: quase sempre é um
 * treino de ontem que ficou sem "finalizar", e deixar duas correndo faria
 * o cronômetro mentir para as duas.
 */
export async function iniciarSessao(treinoId: string, data: string) {
  const { supabase, user } = await usuarioAtual();

  await supabase
    .from("sessoes_treino")
    .update({ fim: new Date().toISOString() })
    .eq("usuario_id", user.id)
    .is("fim", null);

  await supabase
    .from("sessoes_treino")
    .insert({ usuario_id: user.id, treino_id: treinoId, data });

  revalidatePath(CAMINHO);
  redirect(`${CAMINHO}/treinos/${treinoId}/sessao`);
}

/** Encerra o treino. O tempo decorrido vira o registro da sessão. */
export async function encerrarSessao(sessaoId: string, treinoId: string) {
  const { supabase, user } = await usuarioAtual();

  await supabase
    .from("sessoes_treino")
    .update({ fim: new Date().toISOString() })
    .eq("usuario_id", user.id)
    .eq("id", sessaoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(CAMINHO);
}

/** Descarta a sessão aberta sem guardar tempo nenhum. */
export async function descartarSessao(sessaoId: string, treinoId: string) {
  const { supabase, user } = await usuarioAtual();

  await supabase
    .from("sessoes_treino")
    .delete()
    .eq("usuario_id", user.id)
    .eq("id", sessaoId);

  revalidatePath(`${CAMINHO}/treinos/${treinoId}/sessao`);
  revalidatePath(CAMINHO);
}
