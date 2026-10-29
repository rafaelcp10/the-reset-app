"use client";

import { useState } from "react";
import { FileDown, Share } from "lucide-react";

/**
 * Baixar o relatório em PDF, em dois toques.
 *
 * O primeiro gera o arquivo; o segundo o entrega pelo menu de compartilhar
 * do celular (Arquivos, WhatsApp, AirDrop) ou, no computador, pelo
 * download. Dois toques e não um porque o iPhone só abre o menu de
 * compartilhar em resposta direta a um toque, e esperar o servidor gerar o
 * PDF faz o toque "expirar" — o menu simplesmente não abriria.
 */
export default function BaixarPdf({ mes }: { mes: string }) {
  const [estado, setEstado] = useState<"parado" | "gerando" | "pronto" | "falhou">("parado");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const nome = `the-reset-relatorio-${mes}.pdf`;

  async function gerar() {
    setEstado("gerando");
    try {
      const resposta = await fetch(`/saude/evolucao/relatorio/pdf?mes=${mes}`);
      if (!resposta.ok) throw new Error(String(resposta.status));
      setArquivo(new File([await resposta.blob()], nome, { type: "application/pdf" }));
      setEstado("pronto");
    } catch {
      setEstado("falhou");
    }
  }

  async function entregar() {
    if (!arquivo) return;
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo], title: "Relatório — The Reset" });
      } catch {
        // Fechar o menu sem escolher nada também cai aqui; não é erro.
      }
      return;
    }
    const url = URL.createObjectURL(arquivo);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  const BOTAO =
    "botao-acento tipo-rotulo flex w-full items-center justify-center gap-2.5 rounded-[12px] py-4 text-center text-[16px] tracking-[.09em] text-fundo disabled:opacity-60";

  return (
    <div className="flex flex-col gap-2">
      {estado === "pronto" ? (
        <button type="button" onClick={entregar} className={BOTAO}>
          <Share className="h-5 w-5" strokeWidth={2} aria-hidden />
          Salvar ou enviar o PDF
        </button>
      ) : (
        <button type="button" onClick={gerar} disabled={estado === "gerando"} className={BOTAO}>
          <FileDown className="h-5 w-5" strokeWidth={2} aria-hidden />
          {estado === "gerando" ? "Gerando o PDF" : "Gerar PDF"}
        </button>
      )}
      <p className="px-1 text-[14.5px] leading-[1.5] text-auxiliar-fraco">
        {estado === "falhou"
          ? "Não deu para gerar agora. Tente de novo em instantes."
          : "Sem as fotos: elas ficam só no app."}
      </p>
    </div>
  );
}
