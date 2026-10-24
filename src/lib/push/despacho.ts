import { NextResponse } from "next/server";
import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * O envio das notificações agendadas, para qualquer quantidade de gente.
 *
 * Quem decide quem recebe é o banco: as funções `reivindicar_*` (migration
 * `20261024000000_notificacoes_escalaveis.sql`) devolvem só quem está no
 * horário agora, e já **reservam** o aviso na mesma operação — duas
 * execuções ao mesmo tempo não conseguem reservar a mesma pessoa. Este
 * arquivo só envia o que foi reservado, em lotes, e devolve a reserva de
 * quem não recebeu por falha passageira, para o minuto seguinte tentar.
 *
 * O cron chama de minuto em minuto. Cada execução trabalha até acabar a
 * fila ou o orçamento de tempo; o que sobrar, a do minuto seguinte pega —
 * e várias execuções podem dividir uma fila grande sem repetir ninguém.
 */

/** Pessoas por chamada ao banco. */
const LOTE = 500;

/**
 * Envios simultâneos ao serviço de push.
 *
 * Todos de uma vez, como era, abre milhares de conexões numa função só e
 * derruba a própria função. Com 25 e ~150 ms por envio, saem perto de 150
 * por segundo — 7 a 8 mil por execução, e uma execução nova a cada minuto.
 */
const CONCORRENCIA = 25;

/**
 * Quanto tempo uma execução trabalha antes de parar de pedir lotes novos.
 * Abaixo do `maxDuration` das rotas (60 s), com folga para o lote em
 * andamento terminar e para o registro da execução.
 */
const ORCAMENTO_MS = 40_000;

export type Aviso = {
  usuarioId: string;
  /** O dia da pessoa e o tipo reservados — é o que se devolve se falhar. */
  data: string;
  tipo: string;
  carga: Record<string, unknown>;
  /**
   * Por quanto tempo o serviço de push guarda o aviso se o aparelho estiver
   * desligado. O padrão da biblioteca é **quatro semanas**: um check-in de
   * terça chegaria no sábado. O teto é o mesmo de atraso do próprio aviso.
   */
  ttlSegundos: number;
};

export type Reivindicador = (
  supabase: SupabaseClient,
  lote: number,
) => Promise<Aviso[]>;

type Resultado = {
  reservados: number;
  enviados: number;
  falhas: number;
  removidas: number;
};

type Inscricao = {
  usuario_id: string;
  endpoint: string;
  chaves: { p256dh: string; auth: string };
};

/** Executa `fn` em cada item, no máximo `limite` ao mesmo tempo. */
async function emParalelo<T>(
  itens: T[],
  limite: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let proximo = 0;
  const trabalhadores = Array.from(
    { length: Math.min(limite, itens.length) },
    async () => {
      while (proximo < itens.length) {
        const item = itens[proximo++];
        await fn(item);
      }
    },
  );
  await Promise.all(trabalhadores);
}

async function despachar(
  supabase: SupabaseClient,
  avisos: Aviso[],
): Promise<Resultado> {
  const ids = [...new Set(avisos.map((a) => a.usuarioId))];

  // Pelo corpo da chamada, e não pela URL: a lista de ids na URL estoura com
  // algumas centenas de pessoas.
  const { data, error } = await supabase.rpc("inscricoes_de", { p_usuarios: ids });
  if (error) throw new Error(`inscricoes_de: ${error.message}`);

  const porUsuario = new Map<string, Inscricao[]>();
  for (const i of (data ?? []) as Inscricao[]) {
    porUsuario.set(i.usuario_id, [...(porUsuario.get(i.usuario_id) ?? []), i]);
  }

  const envios = avisos.flatMap((aviso) =>
    (porUsuario.get(aviso.usuarioId) ?? []).map((inscricao) => ({ aviso, inscricao })),
  );

  // Por pessoa: quantos aparelhos receberam e quantos falharam à toa.
  const placar = new Map<Aviso, { ok: number; passageiras: number }>();
  const mortas: string[] = [];
  let enviados = 0;
  let falhas = 0;

  await emParalelo(envios, CONCORRENCIA, async ({ aviso, inscricao }) => {
    const p = placar.get(aviso) ?? { ok: 0, passageiras: 0 };
    placar.set(aviso, p);
    try {
      await webpush.sendNotification(
        { endpoint: inscricao.endpoint, keys: inscricao.chaves },
        JSON.stringify(aviso.carga),
        { TTL: aviso.ttlSegundos, urgency: "normal" },
      );
      p.ok += 1;
      enviados += 1;
    } catch (erro) {
      const status = (erro as { statusCode?: number }).statusCode;
      // 404/410: o navegador descartou a inscrição. Não adianta insistir.
      if (status === 404 || status === 410) {
        mortas.push(inscricao.endpoint);
      } else {
        p.passageiras += 1;
        falhas += 1;
      }
    }
  });

  let removidas = 0;
  if (mortas.length > 0) {
    const { data: n } = await supabase.rpc("remover_inscricoes", { p_endpoints: mortas });
    removidas = Number(n ?? 0);
  }

  // Quem não recebeu em aparelho nenhum por falha passageira (fila cheia no
  // serviço de push, rede) ganha a reserva de volta: o minuto seguinte
  // tenta de novo, dentro do teto de atraso. Quem recebeu em pelo menos um
  // aparelho fica avisado — celular e tablet são um aviso só.
  const devolver = avisos.filter((a) => {
    const p = placar.get(a);
    return p && p.ok === 0 && p.passageiras > 0;
  });
  if (devolver.length > 0) {
    await supabase.rpc("liberar_lembretes", {
      p_itens: devolver.map((a) => ({ usuario_id: a.usuarioId, data: a.data, tipo: a.tipo })),
    });
  }

  return { reservados: avisos.length, enviados, falhas, removidas };
}

/**
 * Uma execução de rota de cron: confere a chave, pede lotes a cada
 * reivindicador até a fila ou o tempo acabarem, e registra a execução.
 *
 * A ordem dos reivindicadores importa: a água espera uma hora depois de
 * fita ou foto, então a evolução vem antes dela.
 */
export async function executarCron(
  request: Request,
  rota: string,
  reivindicadores: Reivindicador[],
  /** Só os testes passam outro: o padrão é o cliente com a chave de serviço. */
  cliente?: SupabaseClient,
): Promise<NextResponse> {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const faltando = [
    !process.env.VAPID_PUBLIC_KEY && "VAPID_PUBLIC_KEY",
    !process.env.VAPID_PRIVATE_KEY && "VAPID_PRIVATE_KEY",
    !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);
  if (faltando.length > 0) {
    return NextResponse.json({ erro: "faltam variáveis de ambiente", faltando }, { status: 503 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contato@thereset.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const supabase = cliente ?? createAdminClient();
  const inicio = new Date();
  const limite = Date.now() + ORCAMENTO_MS;
  const total: Resultado = { reservados: 0, enviados: 0, falhas: 0, removidas: 0 };
  let erro: string | null = null;

  try {
    for (const reivindicar of reivindicadores) {
      while (Date.now() < limite) {
        const avisos = await reivindicar(supabase, LOTE);
        if (avisos.length === 0) break;
        let r: Resultado;
        try {
          r = await despachar(supabase, avisos);
        } catch (e) {
          // Reservou e não conseguiu nem começar a enviar: devolve o lote
          // inteiro, senão essas pessoas ficariam marcadas sem ter recebido.
          await supabase.rpc("liberar_lembretes", {
            p_itens: avisos.map((a) => ({ usuario_id: a.usuarioId, data: a.data, tipo: a.tipo })),
          });
          throw e;
        }
        total.reservados += r.reservados;
        total.enviados += r.enviados;
        total.falhas += r.falhas;
        total.removidas += r.removidas;
        if (avisos.length < LOTE) break;
      }
    }
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  // O batimento cardíaco: uma linha por execução, inclusive as vazias. Os
  // 36 dias sem notificação de 2026 passaram sem ninguém ver por falta disto.
  // Se a tabela não existir, o envio já aconteceu — não é motivo para falhar.
  await supabase.from("execucoes_cron").insert({
    rota,
    inicio: inicio.toISOString(),
    fim: new Date().toISOString(),
    ...total,
    erro,
  });

  // Erro do banco (função que não existe, migration que não rodou) responde
  // 503 e não manda nada: melhor calar e gritar no painel do que mandar
  // aviso sem saber quem já recebeu.
  return NextResponse.json({ rota, ...total, erro }, { status: erro ? 503 : 200 });
}
