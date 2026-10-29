import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/supabase/auth";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";
import { buscarRelatorio } from "@/lib/saude/relatorio";
import { BUCKET_FOTOS, type FotoDoRelatorio } from "@/lib/saude/fotos";
import { DocumentoRelatorio, type FotoDoPdf, type ParDoPdf } from "@/lib/saude/relatorioPdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O PDF do relatório de um mês, como arquivo.
 *
 * Só da própria pessoa: a sessão vem do cookie, e o relatório é montado com
 * o cliente dela, sujeito às regras de acesso do banco. Nunca guardado em
 * cache — o arquivo tem peso, medidas e treino, e `no-store` impede que um
 * intermediário fique com uma cópia.
 *
 * As fotos só entram com `?fotos=1`, que só existe quando a pessoa marcou
 * "Incluir as fotos" na hora de gerar. São baixadas aqui do bucket privado,
 * com a sessão dela, e embutidas no arquivo: nenhum link sai dentro do PDF.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) return new Response("não autorizado", { status: 401 });

  const { data: usuario } = await supabase.from("usuarios").select("*").eq("id", user.id).maybeSingle();
  const hoje = dataRitual(agoraNoFuso((usuario?.fuso as string) || "UTC"));
  const atual = hoje.slice(0, 7);

  const pedido = new URL(request.url).searchParams.get("mes");
  const mes = pedido && /^\d{4}-\d{2}$/.test(pedido) && pedido <= atual ? pedido : atual;

  const relatorio = await buscarRelatorio(supabase, user.id, mes, hoje);

  type Cliente = typeof supabase;
  async function baixar(cliente: Cliente, f: FotoDoRelatorio): Promise<FotoDoPdf | null> {
    const { data } = await cliente.storage.from(BUCKET_FOTOS).download(f.caminho);
    if (!data) return null;
    return { data: f.data, imagem: Buffer.from(await data.arrayBuffer()) };
  }

  let fotos: ParDoPdf[] = [];
  if (new URL(request.url).searchParams.get("fotos") === "1") {
    const pares = await Promise.all(
      relatorio.fotos.map(async (par) => {
        const [antes, depois] = await Promise.all([
          baixar(supabase, par.antes),
          par.depois ? baixar(supabase, par.depois) : Promise.resolve(null),
        ]);
        // Sem o "antes", o par não diz nada; uma foto que falhou não
        // derruba o PDF inteiro, só some dele.
        return antes ? { rotulo: par.rotulo, antes, depois } : null;
      }),
    );
    fotos = pares.filter((p): p is ParDoPdf => p !== null);
  }

  const [a, m, d] = hoje.split("-");
  const pdf = await renderToBuffer(
    createElement(DocumentoRelatorio, { r: relatorio, geradoEm: `${d}/${m}/${a}`, fotos }) as ReactElement<DocumentProps>,
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="the-reset-relatorio-${mes}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
