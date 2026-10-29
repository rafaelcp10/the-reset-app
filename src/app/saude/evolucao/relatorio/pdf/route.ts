import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { buscarRelatorio } from "@/lib/saude/relatorio";
import { DocumentoRelatorio } from "@/lib/saude/relatorioPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O PDF do relatório de um mês, como arquivo.
 *
 * Só da própria pessoa: a sessão vem do cookie, e o relatório é montado com
 * o cliente dela, sujeito às regras de acesso do banco. Nunca guardado em
 * cache — o arquivo tem peso, medidas e treino, e `no-store` impede que um
 * intermediário fique com uma cópia.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("não autorizado", { status: 401 });

  const { data: usuario } = await supabase.from("usuarios").select("*").eq("id", user.id).maybeSingle();
  const hoje = dataRitual(agoraNoFuso((usuario?.fuso as string) || "UTC"));
  const atual = hoje.slice(0, 7);

  const pedido = new URL(request.url).searchParams.get("mes");
  const mes = pedido && /^\d{4}-\d{2}$/.test(pedido) && pedido <= atual ? pedido : atual;

  const relatorio = await buscarRelatorio(supabase, user.id, mes, hoje);
  const [a, m, d] = hoje.split("-");
  const pdf = await renderToBuffer(
    createElement(DocumentoRelatorio, { r: relatorio, geradoEm: `${d}/${m}/${a}` }) as ReactElement<DocumentProps>,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="the-reset-relatorio-${mes}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
