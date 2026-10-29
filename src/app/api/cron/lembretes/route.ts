import { executarCron, type Reivindicador } from "@/lib/push/despacho";
import { fraseAgua, fraseEvolucao, fraseTreinoAberto } from "@/lib/push/frases";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Até quanto tempo depois do horário ainda vale avisar.
 *
 * A água tem teto menor que a manhã: um lembrete das 8h chegando às 9h30
 * ainda serve, mas o das 20h chegando às 23h não — a água só faz sentido
 * enquanto o dia ainda dá tempo de beber.
 */
const TETO_MANHA = 180;
const TETO_AGUA = 120;

/**
 * Treino aberto há 1h40 sem ser encerrado: pergunta se já acabou. Treino
 * esquecido virava sessão de 23 horas, e a duração entra na conta de
 * calorias da Nutrição. Um aviso por treino.
 */
const MINUTOS_ATE_LEMBRAR_DO_TREINO = 100;

/**
 * Os lembretes da Saúde, no fuso de cada pessoa. Quem recebe o quê é
 * decidido no banco (`reivindicar_evolucao`, `reivindicar_agua`); aqui só
 * se escrevem os avisos.
 *
 * **Fita**, semanal, domingo às 9h. **Foto**, mensal, às 9h, contando um
 * mês a partir da última foto e não do calendário. Caindo os dois na mesma
 * manhã, uma notificação só. Nenhum dos dois tem interruptor próprio: o
 * interruptor é ter medido, ou ter fotografado, alguma vez.
 *
 * **Água**, de três em três horas, das 8h às 20h, o mais barulhento do app.
 * Para assim que a meta é batida, e o interruptor é ter dito o tamanho da
 * garrafa. Espera uma hora depois de fita ou foto — por isso a evolução
 * vem antes dela na lista lá embaixo.
 */

type LinhaEvolucao = { usuario_id: string; data: string; medir: boolean; fotografar: boolean };
type LinhaAgua = { usuario_id: string; data: string; faltam_garrafas: number; tipo: string };
type LinhaTreino = {
  usuario_id: string;
  data: string;
  sessao_id: string;
  treino_id: string;
  treino_nome: string;
  inicio: string;
};

const evolucao: Reivindicador = async (supabase, lote) => {
  const { data, error } = await supabase.rpc("reivindicar_evolucao", {
    p_lote: lote,
    p_teto: TETO_MANHA,
  });
  if (error) throw new Error(`reivindicar_evolucao: ${error.message}`);

  return ((data ?? []) as LinhaEvolucao[]).map((l) => ({
    usuarioId: l.usuario_id,
    data: l.data,
    tipo: "evolucao",
    ttlSegundos: TETO_MANHA * 60,
    carga: {
      titulo: "The Reset",
      corpo: fraseEvolucao(l.usuario_id, l.data, l.medir, l.fotografar),
      url: "/saude/evolucao",
      comAcoes: false,
      tag: "evolucao",
    },
  }));
};

const agua: Reivindicador = async (supabase, lote) => {
  const { data, error } = await supabase.rpc("reivindicar_agua", {
    p_lote: lote,
    p_teto: TETO_AGUA,
  });
  if (error) throw new Error(`reivindicar_agua: ${error.message}`);

  return ((data ?? []) as LinhaAgua[]).map((l) => ({
    usuarioId: l.usuario_id,
    data: l.data,
    // O horário reservado agora (agua_14, por exemplo). É ele que volta se
    // o envio falhar; os horários anteriores, perdidos, ficam marcados.
    tipo: l.tipo,
    ttlSegundos: TETO_AGUA * 60,
    carga: {
      titulo: "The Reset",
      corpo: fraseAgua(l.usuario_id, l.data, l.tipo, l.faltam_garrafas),
      url: "/saude/nutricao",
      comAcoes: false,
      // Tag por assunto: uma água nova substitui a anterior que não foi
      // vista, em vez de empilhar cinco banners na tela de bloqueio.
      tag: "agua",
    },
  }));
};

const treinoAberto: Reivindicador = async (supabase, lote) => {
  const { data, error } = await supabase.rpc("reivindicar_treino_aberto", {
    p_lote: lote,
    p_minutos: MINUTOS_ATE_LEMBRAR_DO_TREINO,
  });
  if (error) throw new Error(`reivindicar_treino_aberto: ${error.message}`);

  return ((data ?? []) as LinhaTreino[]).map((l) => ({
    usuarioId: l.usuario_id,
    data: l.data,
    tipo: `treino_aberto_${l.sessao_id}`,
    // Duas horas: depois disso a pessoa já saiu da academia faz tempo, e o
    // fechamento usa a última série de qualquer jeito.
    ttlSegundos: 2 * 60 * 60,
    carga: {
      titulo: "The Reset",
      corpo: fraseTreinoAberto(
        l.usuario_id,
        l.data,
        l.treino_nome,
        Math.round((Date.now() - Date.parse(l.inicio)) / 60_000),
      ),
      // Abre a sessão, onde o "Encerrar" está na frente.
      url: `/saude/treinos/${l.treino_id}/sessao`,
      comAcoes: false,
      tag: "treino",
    },
  }));
};

export function GET(request: Request) {
  return executarCron(request, "lembretes", [evolucao, agua, treinoAberto]);
}
