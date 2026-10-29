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
 *
 * As fotos do corpo vão só se a pessoa marcar, e a marca começa desligada
 * **toda vez** — não é lembrada de propósito. O PDF sai do app e vai para
 * onde ela mandar; o relatório que vai para o professor não pode levar as
 * fotos só porque o do mês passado, que foi para ela mesma, levou.
 */

export default function BaixarPdf({ mes, temFotos }: { mes: string; temFotos: boolean }) {
  const [estado, setEstado] = useState<"parado" | "gerando" | "pronto" | "falhou">("parado");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [comFotos, setComFotos] = useState(false);
  const nome = `the-reset-relatorio-${mes}.pdf`;

  function marcarFotos(valor: boolean) {
    setComFotos(valor);
    // O arquivo pronto foi gerado com a escolha antiga.
    setArquivo(null);
    setEstado("parado");
  }

  const fotos = temFotos && comFotos;

  async function gerar() {
    setEstado("gerando");
    try {
      const resposta = await fetch(`/saude/evolucao/relatorio/pdf?mes=${mes}${fotos ? "&fotos=1" : ""}`);
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
      {temFotos && (
        <label className="flex min-h-[48px] cursor-pointer items-center gap-3 px-1 text-[15.5px] text-texto">
          <input
            type="checkbox"
            checked={comFotos}
            onChange={(ev) => marcarFotos(ev.target.checked)}
            className="h-5 w-5 accent-[#B6B8BB]"
          />
          Incluir as fotos
        </label>
      )}
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
          : fotos
            ? "Com as fotos do corpo. Confira para quem vai mandar."
            : temFotos
              ? "Sem as fotos: elas ficam só no app."
              : "Os treinos, o corpo e as dicas do mês."}
      </p>
    </div>
  );
}
