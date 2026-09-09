import type { SupabaseClient } from "@supabase/supabase-js";
import { buscarFrasesAtuais } from "@/lib/frases/dados";
import type { Funcao, FraseRow } from "@/lib/frases/modelo";
import {
  agoraNoFuso,
  dataPorExtenso,
  dataRitual,
  diaAnteriorISO,
  domingoDaSemana,
  modoRitual,
  numeroDaSemana,
  type ModoRitual,
} from "./tempo";

export type CompromissoRow = {
  id: string;
  usuario_id: string;
  semana_inicio: string;
  texto: string;
  ordem: number;
};

export type MusicaRow = {
  id: string;
  usuario_id: string;
  url: string;
  nome: string | null;
  ordem: number;
};

export type InegociavelSlot = {
  ordem: number;
  compromisso: CompromissoRow | null;
  feitoHoje: boolean | null;
};

export type EstadoRitual = {
  modo: ModoRitual;
  dataRitual: string;
  semanaInicio: string;
  numeroSemana: number;
  dataExtenso: string;
  frases: Record<Funcao, FraseRow>;
  musica: MusicaRow | null;
  inegociaveis: InegociavelSlot[];
  linhaHoje: string | null;
  feitoHoje: boolean | null;
  linhaOntem: string | null;
  feitoOntem: boolean | null;
  repsPadrao: number;
  modoMaosLivres: boolean;
};

const HORARIO_PADRAO = "21:00";
const FUSO_PADRAO = "UTC";
const REPS_PADRAO = 3;
const SLOTS_INEGOCIAVEIS = [0, 1, 2] as const;

/**
 * Lê a intenção guardada num dia. Fica numa consulta à parte de propósito:
 * se a coluna ainda não existir no banco, o erro morre aqui em vez de
 * derrubar a busca inteira do ritual — já aconteceu neste projeto, e o
 * sintoma é a tela inteira mentir em silêncio.
 */
export async function buscarIntencao(
  supabase: SupabaseClient,
  usuarioId: string,
  data: string,
): Promise<string | null> {
  const { data: linha, error } = await supabase
    .from("dias")
    .select("intencao_amanha")
    .eq("usuario_id", usuarioId)
    .eq("data", data)
    .maybeSingle();

  if (error) return null;
  return (linha?.intencao_amanha as string | null) ?? null;
}

export async function buscarEstadoRitual(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<EstadoRitual> {
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("horario_checkin, fuso, criado_em, reps_padrao, modo_maos_livres")
    .eq("id", usuarioId)
    .maybeSingle();

  const fuso: string = usuario?.fuso || FUSO_PADRAO;
  const horarioCheckin: string =
    usuario?.horario_checkin?.slice(0, 5) || HORARIO_PADRAO;
  const criadoEm: string = usuario?.criado_em ?? new Date().toISOString();
  const repsPadrao: number = usuario?.reps_padrao ?? REPS_PADRAO;
  const modoMaosLivres: boolean = usuario?.modo_maos_livres ?? false;

  const partes = agoraNoFuso(fuso);
  const hoje = dataRitual(partes);
  const ontem = diaAnteriorISO(hoje);
  const semanaInicio = domingoDaSemana(hoje);
  const modo = modoRitual(partes, horarioCheckin);

  const [frases, { data: compromissos }, { data: dias }, { data: musicas }] =
    await Promise.all([
      buscarFrasesAtuais(supabase, usuarioId),
      supabase
        .from("compromissos")
        .select("*")
        .eq("usuario_id", usuarioId)
        .eq("semana_inicio", semanaInicio)
        .order("ordem", { ascending: true }),
      supabase
        .from("dias")
        .select("data, linha_do_dia, feito")
        .eq("usuario_id", usuarioId)
        .in("data", [hoje, ontem]),
      supabase
        .from("musicas")
        .select("*")
        .eq("usuario_id", usuarioId)
        .order("ordem", { ascending: false })
        .limit(1),
    ]);

  const compromissosPorOrdem = new Map(
    ((compromissos ?? []) as CompromissoRow[]).map((c) => [c.ordem, c]),
  );

  let compromissoDiaPorId = new Map<string, boolean | null>();
  const idsCompromissos = [...compromissosPorOrdem.values()].map((c) => c.id);
  if (idsCompromissos.length > 0) {
    const { data: compromissosDia } = await supabase
      .from("compromissos_dia")
      .select("compromisso_id, feito")
      .eq("data", hoje)
      .in("compromisso_id", idsCompromissos);
    compromissoDiaPorId = new Map(
      (compromissosDia ?? []).map((cd) => [
        cd.compromisso_id as string,
        cd.feito as boolean | null,
      ]),
    );
  }

  const inegociaveis: InegociavelSlot[] = SLOTS_INEGOCIAVEIS.map((ordem) => {
    const compromisso = compromissosPorOrdem.get(ordem) ?? null;
    return {
      ordem,
      compromisso,
      feitoHoje: compromisso
        ? (compromissoDiaPorId.get(compromisso.id) ?? null)
        : null,
    };
  });

  const diaHoje = (dias ?? []).find((d) => d.data === hoje);
  const diaOntem = (dias ?? []).find((d) => d.data === ontem);

  return {
    modo,
    dataRitual: hoje,
    semanaInicio,
    numeroSemana: numeroDaSemana(criadoEm, hoje),
    dataExtenso: dataPorExtenso(hoje),
    frases,
    musica: (musicas?.[0] as MusicaRow) ?? null,
    inegociaveis,
    linhaHoje: diaHoje?.linha_do_dia ?? null,
    feitoHoje: diaHoje?.feito ?? null,
    linhaOntem: diaOntem?.linha_do_dia ?? null,
    feitoOntem: diaOntem?.feito ?? null,
    repsPadrao,
    modoMaosLivres,
  };
}
