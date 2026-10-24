import { executarCron, type Reivindicador } from "@/lib/push/despacho";

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
      // precisar lembrar o que escreveu de manhã.
      corpo: l.linha_do_dia ? `Você disse: ${l.linha_do_dia}` : "O que você fez hoje?",
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

export function GET(request: Request) {
  return executarCron(request, "checkin", [checkin]);
}
