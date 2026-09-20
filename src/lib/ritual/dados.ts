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
  periodoDoDia,
  type ModoRitual,
  type PeriodoDoDia,
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
  /** Como a pessoa pediu para ser chamada. Nulo até ela preencher. */
  nome: string | null;
  modo: ModoRitual;
  /** A hora do relógio — saudação e cor. Não confundir com `modo`. */
  periodo: PeriodoDoDia;
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
  /** O que a pessoa disse hoje à noite que faria amanhã. */
  intencaoHoje: string | null;
  /** O que ela disse ontem à noite que faria hoje. */
  intencaoOntem: string | null;
  repsPadrao: number;
  modoMaosLivres: boolean;
  /** Tocar a voz por cima da música do aparelho, em vez de interrompê-la. */
  misturarComMusica: boolean;
};

const HORARIO_PADRAO = "21:00";
const FUSO_PADRAO = "UTC";
const REPS_PADRAO = 3;
const SLOTS_INEGOCIAVEIS = [0, 1, 2] as const;

export async function buscarEstadoRitual(
  supabase: SupabaseClient,
  usuarioId: string,
): Promise<EstadoRitual> {
  // As frases não dependem do fuso, então saem na mesma leva do perfil em
  // vez de esperar uma travessia de rede inteira para começar.
  const [{ data: usuario }, frases] = await Promise.all([
    supabase
      .from("usuarios")
      // `*` de propósito, e não a lista de colunas.
      //
      // O PostgREST derruba o select inteiro quando uma coluna não existe:
      // basta uma migration ainda não rodada para `usuario` voltar nulo e a
      // tela inteira parecer vazia, como se nada tivesse sido preenchido.
      // Aconteceu em 2026-09-20 e custou uma tela de Nutrição em branco com
      // todos os dados salvos no banco.
      //
      // Com `*`, coluna que ainda não existe simplesmente não vem, e o campo
      // fica vazio em vez de derrubar o resto. É uma linha só de usuário: o
      // custo de trazer tudo é nenhum.
      .select("*")
      .eq("id", usuarioId)
      .maybeSingle(),
    buscarFrasesAtuais(supabase, usuarioId),
  ]);

  const fuso: string = usuario?.fuso || FUSO_PADRAO;
  const horarioCheckin: string =
    usuario?.horario_checkin?.slice(0, 5) || HORARIO_PADRAO;
  const criadoEm: string = usuario?.criado_em ?? new Date().toISOString();
  const repsPadrao: number = usuario?.reps_padrao ?? REPS_PADRAO;
  const modoMaosLivres: boolean = usuario?.modo_maos_livres ?? false;
  const misturarComMusica: boolean = usuario?.misturar_com_musica ?? false;
  // Só o primeiro nome: "Bom dia, Rafael Pires" soa como cadastro, não
  // como alguém falando com você.
  const nome: string | null =
    (usuario?.nome as string | null)?.trim().split(/\s+/)[0] || null;

  const partes = agoraNoFuso(fuso);
  const hoje = dataRitual(partes);
  const ontem = diaAnteriorISO(hoje);
  const semanaInicio = domingoDaSemana(hoje);
  const modo = modoRitual(partes, horarioCheckin);
  const periodo = periodoDoDia(partes);

  const [{ data: compromissos }, { data: dias }, { data: musicas }] =
    await Promise.all([
      // A marcação de hoje vem junto com o compromisso, encaixada pelo
      // próprio Postgres. Buscá-la depois exigia saber os ids primeiro, o
      // que obrigava as duas consultas a andarem em fila.
      supabase
        .from("compromissos")
        .select("*, compromissos_dia(feito)")
        .eq("usuario_id", usuarioId)
        .eq("semana_inicio", semanaInicio)
        .eq("compromissos_dia.data", hoje)
        .order("ordem", { ascending: true }),
      supabase
        .from("dias")
        .select("data, linha_do_dia, feito, intencao_amanha")
        .eq("usuario_id", usuarioId)
        .in("data", [hoje, ontem]),
      supabase
        .from("musicas")
        .select("*")
        .eq("usuario_id", usuarioId)
        .order("ordem", { ascending: false })
        .limit(1),
    ]);

  type CompromissoComDia = CompromissoRow & {
    compromissos_dia?: { feito: boolean | null }[];
  };
  const compromissosPorOrdem = new Map(
    ((compromissos ?? []) as CompromissoComDia[]).map((c) => [c.ordem, c]),
  );

  const inegociaveis: InegociavelSlot[] = SLOTS_INEGOCIAVEIS.map((ordem) => {
    const linha = compromissosPorOrdem.get(ordem);
    if (!linha) return { ordem, compromisso: null, feitoHoje: null };

    // A marcação vem aninhada; o compromisso segue para a tela sem ela.
    const { compromissos_dia: marcacoes, ...compromisso } = linha;
    return {
      ordem,
      compromisso,
      feitoHoje: marcacoes?.[0]?.feito ?? null,
    };
  });

  const diaHoje = (dias ?? []).find((d) => d.data === hoje);
  const diaOntem = (dias ?? []).find((d) => d.data === ontem);

  return {
    nome,
    modo,
    periodo,
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
    intencaoHoje: diaHoje?.intencao_amanha ?? null,
    intencaoOntem: diaOntem?.intencao_amanha ?? null,
    repsPadrao,
    modoMaosLivres,
    misturarComMusica,
  };
}
