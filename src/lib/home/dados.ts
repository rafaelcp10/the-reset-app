import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarFrasesAtuais } from "@/lib/frases/dados";
import type { FraseRow } from "@/lib/frases/modelo";
import {
  agoraNoFuso,
  dataRitual,
  diaAnteriorISO,
  diferencaDias,
  domingoDaSemana,
  formatarHora,
  numeroDaSemana,
  proximaSemanaISO,
} from "@/lib/ritual/tempo";

const FUSO_PADRAO = "UTC";

export type FaixaSemana = {
  semanaInicio: string;
  diasRespondidos: number;
  numero: number;
};

export type EstadoHome = {
  identidade: FraseRow | undefined;
  numeroSemana: number;
  semanasCumpridas: number;
  faixaSemanas: FaixaSemana[];
  linhaOntem: string | null;
  feitoOntem: boolean | null;
  espelhoFeitoHoje: boolean;
  horaRegistroHoje: string | null;
  diasSemAbrir: number | null;
};

/**
 * "Uma semana conta quando o usuário abriu e respondeu" — não quando
 * acertou tudo. `semanasCumpridas` só olha se existe algum registro em
 * `dias` naquela semana, nunca quantos inegociáveis foram feitos.
 */
export async function buscarEstadoHome(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<EstadoHome> {
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("fuso, criado_em")
    .eq("id", usuarioId)
    .maybeSingle();

  const fuso: string = usuario?.fuso || FUSO_PADRAO;
  const criadoEm: string = usuario?.criado_em ?? new Date().toISOString();

  const partes = agoraNoFuso(fuso);
  const hoje = dataRitual(partes);
  const ontem = diaAnteriorISO(hoje);
  const semanaAtualInicio = domingoDaSemana(hoje);
  const semanaContaInicio = domingoDaSemana(criadoEm.slice(0, 10));

  const [frases, { data: dias }] = await Promise.all([
    buscarFrasesAtuais(supabase, usuarioId),
    supabase
      .from("dias")
      .select("data, linha_do_dia, feito, espelho_feito_em")
      .eq("usuario_id", usuarioId)
      .gte("data", semanaContaInicio),
  ]);

  const diasPorSemana = new Map<string, number>();
  for (const linha of dias ?? []) {
    const semana = domingoDaSemana(linha.data as string);
    diasPorSemana.set(semana, (diasPorSemana.get(semana) ?? 0) + 1);
  }

  const faixaSemanas: FaixaSemana[] = [];
  for (
    let cursor = semanaContaInicio;
    cursor <= semanaAtualInicio;
    cursor = proximaSemanaISO(cursor)
  ) {
    faixaSemanas.push({
      semanaInicio: cursor,
      diasRespondidos: diasPorSemana.get(cursor) ?? 0,
      numero: numeroDaSemana(criadoEm, cursor),
    });
  }

  const semanasCumpridas = faixaSemanas.filter(
    (s) => s.diasRespondidos > 0,
  ).length;

  const diaHoje = (dias ?? []).find((d) => d.data === hoje);
  const diaOntem = (dias ?? []).find((d) => d.data === ontem);

  const datasRegistradas = (dias ?? []).map((d) => d.data as string);
  const ultimoRegistro =
    datasRegistradas.length > 0
      ? datasRegistradas.reduce((a, b) => (a > b ? a : b))
      : null;
  const diasSemAbrir = ultimoRegistro
    ? diferencaDias(hoje, ultimoRegistro)
    : null;

  return {
    identidade: frases.identidade,
    numeroSemana: numeroDaSemana(criadoEm, hoje),
    semanasCumpridas,
    faixaSemanas,
    linhaOntem: diaOntem?.linha_do_dia ?? null,
    feitoOntem: diaOntem?.feito ?? null,
    espelhoFeitoHoje: Boolean(diaHoje?.espelho_feito_em),
    horaRegistroHoje: diaHoje?.espelho_feito_em
      ? formatarHora(diaHoje.espelho_feito_em, fuso)
      : null,
    diasSemAbrir,
  };
}
