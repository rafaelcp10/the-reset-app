import { executarCron, type Reivindicador } from "@/lib/push/despacho";
import { fraseCheckin, frasePlanejamento } from "@/lib/push/frases";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Até quanto tempo depois do horário ainda vale avisar.
 *
 * O teto existe para o check-in de 21h30 não virar notificação às 2h da
 * manhã: atrasado demais, o app cala e tenta amanhã. Com o cron de minuto
 * em minuto ele quase nunca é usado — fica de rede para quando o
 * agendador falhar ou a fila do minuto for maior que uma execução.
 */
const TETO_MINUTOS = 180;

/**
 * O lembrete de planejar a semana: domingo às 10h, no fuso de cada pessoa.
 * Às 9h de domingo sai a fita, e dois avisos no mesmo minuto é o caminho
 * mais curto para desligar tudo. Quem já fez a revisão de domingo não é
 * lembrado. O teto é largo porque planejar às 15h ainda serve.
 */
const HORA_DO_PLANEJAMENTO = 10;
const TETO_PLANEJAMENTO = 360;

type Linha = { usuario_id: string; data: string; linha_do_dia: string | null };

/**
 * O check-in da noite.
 *
 * Quem decide quem recebe é o banco (`reivindicar_checkin`): está no
 * horário, não respondeu hoje, não foi avisado hoje, tem aparelho inscrito.
 * Aqui só se escreve o aviso.
 */
const checkin: Reivindicador = async (supabase, lote) => {
  const { data, error } = await supabase.rpc("reivindicar_checkin", {
    p_lote: lote,
    p_teto: TETO_MINUTOS,
  });
  if (error) throw new Error(`reivindicar_checkin: ${error.message}`);

  return ((data ?? []) as Linha[]).map((l) => ({
    usuarioId: l.usuario_id,
    data: l.data,
    tipo: "checkin",
    ttlSegundos: TETO_MINUTOS * 60,
    carga: {
      titulo: "The Reset",
      // A notificação carrega a própria linha da pessoa: ela decide sem
      // precisar lembrar o que escreveu de manhã. A frase em volta varia
      // de um dia para o outro (lib/push/frases.ts).
      corpo: fraseCheckin(l.usuario_id, l.data, l.linha_do_dia),
      // Aponta para a seção do check-in, e não para o topo do Ritual: à
      // noite a linha do dia é a última seção da tela, e abrir no topo
      // custava uma rolagem inteira até onde moram os cinco segundos.
      url: "/ritual#linha-do-dia",
      data: l.data,
      comAcoes: Boolean(l.linha_do_dia),
      tag: "checkin",
    },
  }));
};

/** Domingo: fechar a semana que acabou e decidir os inegociáveis da nova. */
const planejamento: Reivindicador = async (supabase, lote) => {
  const { data, error } = await supabase.rpc("reivindicar_planejamento", {
    p_lote: lote,
    p_hora: HORA_DO_PLANEJAMENTO,
    p_teto: TETO_PLANEJAMENTO,
  });
  if (error) throw new Error(`reivindicar_planejamento: ${error.message}`);

  return ((data ?? []) as { usuario_id: string; data: string }[]).map((l) => ({
    usuarioId: l.usuario_id,
    data: l.data,
    tipo: "planejamento",
    ttlSegundos: TETO_PLANEJAMENTO * 60,
    carga: {
      titulo: "The Reset",
      corpo: frasePlanejamento(l.usuario_id, l.data),
      url: "/ritual/domingo",
      comAcoes: false,
      tag: "planejamento",
    },
  }));
};

/** Os avisos do ritual: o check-in da noite e o planejamento de domingo. */
export function GET(request: Request) {
  return executarCron(request, "checkin", [checkin, planejamento]);
}
