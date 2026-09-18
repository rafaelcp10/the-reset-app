import type { SupabaseClient } from "@supabase/supabase-js";
import { domingoDaSemana, somarDiasISO } from "@/lib/ritual/tempo";

/** Abreviações dos dias, 0 = domingo — a mesma convenção das tarefas. */
export const DIAS_ABREV = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

export type DiaDaSemana = {
  indice: number;
  abrev: string;
  /** A pessoa marcou algum treino para este dia da semana. */
  marcado: boolean;
  /** Houve sessão terminada neste dia. */
  feito: boolean;
  hoje: boolean;
  futuro: boolean;
};

export type ResumoDaSemana = {
  dias: DiaDaSemana[];
  feitos: number;
  marcados: number;
};

/**
 * A semana de treino, de domingo a sábado.
 *
 * Semana, e nunca dias corridos: é a contagem do app inteiro, e uma semana
 * perdida no meio não apaga as outras. Aqui isso importa duas vezes, porque
 * um quadro de sete dias é exatamente onde nasceria um streak se ninguém
 * estivesse olhando — este não encadeia nada, não zera nada e não guarda
 * recorde. É a foto desta semana, e só.
 *
 * O denominador é o que a própria pessoa marcou, não uma meta do app. Quem
 * não marcou dia nenhum não tem denominador, e o painel mostra só a conta.
 */
export async function resumoDaSemana(
  supabase: SupabaseClient,
  usuarioId: string,
  hojeISO: string,
  diaDeHoje: number,
  diasMarcados: number[],
): Promise<ResumoDaSemana> {
  const domingo = domingoDaSemana(hojeISO);
  const sabado = somarDiasISO(domingo, 6);

  const { data } = await supabase
    .from("sessoes_treino")
    .select("data")
    .eq("usuario_id", usuarioId)
    .not("fim", "is", null)
    .gte("data", domingo)
    .lte("data", sabado);

  const feitosNoDia = new Set(
    (data ?? []).map((s) => {
      const [ano, mes, dia] = (s.data as string).split("-").map(Number);
      return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
    }),
  );

  const marcados = new Set(diasMarcados);

  const dias = DIAS_ABREV.map((abrev, indice) => ({
    indice,
    abrev,
    marcado: marcados.has(indice),
    feito: feitosNoDia.has(indice),
    hoje: indice === diaDeHoje,
    futuro: indice > diaDeHoje,
  }));

  return {
    dias,
    feitos: dias.filter((d) => d.feito).length,
    marcados: marcados.size,
  };
}
