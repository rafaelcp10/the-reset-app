"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { apagarFoto } from "@/lib/saude/acoes";
import type { Foto } from "@/lib/saude/fotos";

/**
 * Uma foto da galeria, com a data e a opção de apagar.
 *
 * Apagar pede dois toques. Não é cerimônia: a de hoje dá para tirar de
 * novo, mas a de um ano atrás não existe em lugar nenhum além daqui, e um
 * toque errado numa lista de rolagem apagaria justamente essa.
 *
 * O botão de confirmar não é vermelho — vermelho neste app é erro de
 * sistema, e apagar a própria foto é decisão de quem manda nela.
 */
export default function ItemFoto({ foto }: { foto: Foto }) {
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-[12px] bg-superficie3">
        {foto.url && (
          // URL assinada e privada: passar pelo otimizador do Next colocaria
          // foto de corpo num cache que não é do usuário.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto.url}
            alt=""
            className="w-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[16.5px] text-texto">
          {porExtenso(foto.data)}
        </span>

        {confirmando ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="min-h-11 px-3 text-[14.5px] text-auxiliar"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={apagando}
              onClick={() => iniciar(() => void apagarFoto(foto.data))}
              className="tipo-rotulo min-h-11 rounded-[10px] bg-superficie3 px-4 text-[13px] tracking-[.09em] text-texto disabled:opacity-60"
            >
              {apagando ? "Apagando…" : "Apagar"}
            </button>
          </span>
        ) : (
          <button
            type="button"
            aria-label={`Apagar a foto de ${porExtenso(foto.data)}`}
            onClick={() => setConfirmando(true)}
            className="-m-3 inline-flex shrink-0 p-3 text-auxiliar"
          >
            <Trash2 className="h-[20px] w-[20px]" strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}

/** Com o ano: a galeria atravessa anos, e "18 de setembro" fica ambíguo. */
function porExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(ano, mes - 1, dia, 12)));
}
