"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PERIODOS, type PeriodoTarefa, type TipoTarefa } from "./dados";

const TIPOS: TipoTarefa[] = ["recorrente", "semana", "data"];

async function usuarioAtual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/**
 * Cria a tarefa só com o texto. O tipo se escolhe depois, no detalhe —
 * o campo de adicionar nunca vira formulário.
 */
/**
 * Cria a tarefa já com o quando.
 *
 * O campo continua sendo um só — escrever e pronto —, mas o período fica
 * ali do lado, porque decidir "de manhã" no instante em que a tarefa nasce
 * é barato, e voltar depois no detalhe para dizer isso é caro.
 *
 * "Recorrente" divide o mesmo espaço por ser a mesma pergunta em outra
 * escala: quando isso acontece. Os dias da semana continuam no detalhe,
 * que é onde eles cabem.
 */
export async function criarTarefa(caminhoAtual: string, formData: FormData) {
  const texto = ((formData.get("texto") as string) ?? "").trim();
  if (!texto) return;

  const quando = ((formData.get("quando") as string) ?? "").trim();
  const recorrente = quando === "recorrente";
  const periodo = PERIODOS.includes(quando as PeriodoTarefa)
    ? (quando as PeriodoTarefa)
    : null;

  const { supabase, user } = await usuarioAtual();
  await supabase.from("tarefas").insert({
    usuario_id: user.id,
    texto,
    tipo: recorrente ? "recorrente" : "semana",
    periodo,
  });

  revalidatePath(caminhoAtual);
}

/** Marca ou desmarca a tarefa num dia. A linha existir é a marcação. */
export async function alternarTarefaDia(
  caminhoAtual: string,
  tarefaId: string,
  dataISO: string,
  marcar: boolean,
) {
  const { supabase, user } = await usuarioAtual();

  if (marcar) {
    await supabase
      .from("tarefas_dia")
      .upsert(
        { usuario_id: user.id, tarefa_id: tarefaId, data: dataISO },
        { onConflict: "tarefa_id,data" },
      );
  } else {
    await supabase
      .from("tarefas_dia")
      .delete()
      .eq("usuario_id", user.id)
      .eq("tarefa_id", tarefaId)
      .eq("data", dataISO);
  }

  revalidatePath(caminhoAtual);
}

/** Traz um item "da semana" para um dia. */
export async function puxarParaHoje(
  caminhoAtual: string,
  tarefaId: string,
  dataISO: string,
) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .update({ puxado_para: dataISO })
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath(caminhoAtual);
}

/** Devolve o item para "Esta semana". */
export async function devolverParaSemana(
  caminhoAtual: string,
  tarefaId: string,
) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .update({ puxado_para: null })
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath(caminhoAtual);
}

export async function salvarTextoTarefa(
  caminhoAtual: string,
  tarefaId: string,
  formData: FormData,
) {
  const texto = ((formData.get("texto") as string) ?? "").trim();
  if (!texto) return;

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .update({ texto })
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath(caminhoAtual);
}

/**
 * Troca o tipo. Cada tipo usa um campo diferente, então os outros são
 * limpos junto — evita item recorrente carregando uma data órfã.
 */
export async function salvarTipoTarefa(
  caminhoAtual: string,
  tarefaId: string,
  tipo: TipoTarefa,
  dataISO: string | null,
) {
  if (!TIPOS.includes(tipo)) return;

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .update({
      tipo,
      data: tipo === "data" ? dataISO : null,
      dias_semana: tipo === "recorrente" ? undefined : [],
      puxado_para: null,
    })
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath(caminhoAtual);
}

export async function salvarDiasSemana(
  caminhoAtual: string,
  tarefaId: string,
  diasSemana: number[],
) {
  const dias = [...new Set(diasSemana)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .update({ dias_semana: dias })
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath(caminhoAtual);
}

/**
 * Troca o período do item. Tocar no que já está marcado desmarca — nem
 * tudo tem hora, e "a qualquer hora" precisa ser alcançável de volta.
 */
export async function salvarPeriodoTarefa(
  caminhoAtual: string,
  tarefaId: string,
  periodo: PeriodoTarefa | null,
) {
  if (periodo !== null && !PERIODOS.includes(periodo)) return;

  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .update({ periodo })
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath(caminhoAtual);
}

export async function salvarDataTarefa(
  caminhoAtual: string,
  tarefaId: string,
  dataISO: string,
) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .update({ data: dataISO || null })
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath(caminhoAtual);
}

export async function excluirTarefa(tarefaId: string) {
  const { supabase, user } = await usuarioAtual();
  await supabase
    .from("tarefas")
    .delete()
    .eq("usuario_id", user.id)
    .eq("id", tarefaId);

  revalidatePath("/todo");
  redirect("/todo");
}
