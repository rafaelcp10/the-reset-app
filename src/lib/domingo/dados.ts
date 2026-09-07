import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarFrasesAtuais } from "@/lib/frases/dados";
import type { Funcao, FraseRow } from "@/lib/frases/modelo";
import type { CompromissoRow } from "@/lib/ritual/dados";
import {
  agoraNoFuso,
  dataRitual,
  diaSemanaAbreviado,
  domingoDaSemana,
  semanaAnteriorISO,
  somarDiasISO,
} from "@/lib/ritual/tempo";

const FUSO_PADRAO = "UTC";

export type DiaResumo = {
  data: string;
  diaAbrev: string;
  linha: string | null;
  feito: boolean | null;
};

export type EstadoRevisao = {
  semanaPassadaInicio: string;
  semanaAtualInicio: string;
  dias: DiaResumo[];
  inegociaveisAtuais: (CompromissoRow | null)[];
  frases: Record<Funcao, FraseRow>;
  comoEstouAtual: string | null;
};

export async function buscarEstadoRevisao(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<EstadoRevisao> {
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("fuso")
    .eq("id", usuarioId)
    .maybeSingle();
  const fuso: string = usuario?.fuso || FUSO_PADRAO;

  const hoje = dataRitual(agoraNoFuso(fuso));
  const semanaAtualInicio = domingoDaSemana(hoje);
  const semanaPassadaInicio = semanaAnteriorISO(semanaAtualInicio);
  const datasSemanaPassada = Array.from({ length: 7 }, (_, i) =>
    somarDiasISO(semanaPassadaInicio, i),
  );

  const [frases, { data: diasRows }, { data: compromissos }, { data: revisao }] =
    await Promise.all([
      buscarFrasesAtuais(supabase, usuarioId),
      supabase
        .from("dias")
        .select("data, linha_do_dia, feito")
        .eq("usuario_id", usuarioId)
        .in("data", datasSemanaPassada),
      supabase
        .from("compromissos")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("semana_inicio", semanaAtualInicio)
        .order("ordem", { ascending: true }),
      supabase
        .from("revisoes_semanais")
        .select("como_estou")
        .eq("usuario_id", usuarioId)
        .eq("semana_inicio", semanaPassadaInicio)
        .maybeSingle(),
    ]);

  const diasPorData = new Map((diasRows ?? []).map((d) => [d.data, d]));
  const dias: DiaResumo[] = datasSemanaPassada.map((data) => {
    const linha = diasPorData.get(data);
    return {
      data,
      diaAbrev: diaSemanaAbreviado(data),
      linha: linha?.linha_do_dia ?? null,
      feito: linha?.feito ?? null,
    };
  });

  const compromissosPorOrdem = new Map(
    ((compromissos ?? []) as CompromissoRow[]).map((c) => [c.ordem, c]),
  );
  const inegociaveisAtuais = [0, 1, 2].map(
    (ordem) => compromissosPorOrdem.get(ordem) ?? null,
  );

  return {
    semanaPassadaInicio,
    semanaAtualInicio,
    dias,
    inegociaveisAtuais,
    frases,
    comoEstouAtual: revisao?.como_estou ?? null,
  };
}
