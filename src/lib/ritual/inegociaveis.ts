import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Leva os inegociáveis da semana anterior para a semana atual.
 *
 * Eles vivem por semana, e na virada do domingo os três sumiam da tela.
 * A revisão de domingo existe para lembrar de planejar a semana, não para
 * zerar o que já valia — e na prática os três costumam se repetir.
 *
 * Roda **uma vez por semana**, e é a marca em `inegociaveis_copiados_para`
 * que garante isso. Sem ela, quem apagasse os três de propósito os veria
 * voltar na próxima leitura de tela: limpar um slot apaga a linha, então
 * "semana nova" e "esvaziei de propósito" são a mesma consulta vazia.
 *
 * Nunca sobrescreve o que já existe na semana atual: o upsert ignora
 * conflito de (usuário, semana, ordem), que já era restrição da tabela.
 */
export async function garantirInegociaveisDaSemana(
  supabase: SupabaseClient,
  usuarioId: string,
  semanaInicio: string,
  semanaJaCopiada: string | null,
): Promise<void> {
  if (semanaJaCopiada === semanaInicio) return;

  const marcar = async () => {
    // Falha aqui não é fatal: no pior caso a cópia é tentada de novo, e o
    // upsert a torna inofensiva. Não vale derrubar a tela por isso.
    await supabase
      .from("usuarios")
      .update({ inegociaveis_copiados_para: semanaInicio })
      .eq("id", usuarioId);
  };

  const { data: daSemana } = await supabase
    .from("compromissos")
    .select("id")
    .eq("usuario_id", usuarioId)
    .eq("semana_inicio", semanaInicio)
    .limit(1);

  // Já há algo nesta semana: nada a copiar, e a marca evita voltar aqui.
  if (daSemana && daSemana.length > 0) {
    await marcar();
    return;
  }

  // A semana anterior com inegociáveis, e não necessariamente a de sete
  // dias atrás: quem passou duas semanas sem abrir o app não deveria
  // perder os seus três por causa disso.
  const { data: anteriores } = await supabase
    .from("compromissos")
    .select("semana_inicio, ordem, texto")
    .eq("usuario_id", usuarioId)
    .lt("semana_inicio", semanaInicio)
    .order("semana_inicio", { ascending: false })
    .limit(10);

  const ultima = anteriores?.[0]?.semana_inicio;
  if (!ultima) {
    await marcar();
    return;
  }

  const copiar = anteriores!
    .filter((c) => c.semana_inicio === ultima)
    .map((c) => ({
      usuario_id: usuarioId,
      semana_inicio: semanaInicio,
      ordem: c.ordem as number,
      texto: c.texto as string,
    }));

  if (copiar.length > 0) {
    await supabase
      .from("compromissos")
      .upsert(copiar, { onConflict: "usuario_id,semana_inicio,ordem" });
  }

  await marcar();
}
