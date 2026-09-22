"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { apagarFoto } from "@/lib/saude/acoes";
import { ROTULO_ANGULO, type DiaDeFotos as Dia, type Foto } from "@/lib/saude/fotos";

/**
 * Um dia de fotos: a data e os ângulos que existem dela.
 *
 * Duas por linha, grandes o bastante para valerem alguma coisa. Miniatura
 * em grade de quatro não deixaria ver o que a foto tem para dizer, que é o
 * motivo desta tela existir.
 *
 * Apagar pede dois toques. Não é cerimônia: a de hoje dá para tirar de
 * novo, mas a de um ano atrás não existe em lugar nenhum além daqui, e um
 * toque errado numa lista de rolagem apagaria justamente essa.
 *
 * O botão de confirmar não é vermelho — vermelho neste app é erro de
 * sistema, e apagar a própria foto é decisão de quem manda nela.
 */
export default function DiaDeFotos({ dia }: { dia: Dia }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="tipo-rotulo px-1 text-[14px] tracking-[.1em] text-auxiliar">
        {porExtenso(dia.data)}
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {dia.fotos.map((foto) => (
          <Quadro key={foto.id} foto={foto} />
        ))}
      </div>
    </div>
  );
}

function Quadro({ foto }: { foto: Foto }) {
  const [confirmando, setConfirmando] = useState(false);
  const [apagando, iniciar] = useTransition();

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative overflow-hidden rounded-[10px] bg-superficie3">
        {foto.url && (
          // URL assinada e privada: passar pelo otimizador do Next colocaria
          // foto de corpo num cache que não é do usuário.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto.url}
            alt=""
            className="aspect-[3/4] w-full object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="flex min-h-11 items-center justify-between gap-1">
        {confirmando ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="min-h-11 pr-1 text-[15px] text-auxiliar"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={apagando}
              onClick={() =>
                iniciar(() => void apagarFoto(foto.data, foto.angulo))
              }
              className="tipo-rotulo min-h-11 rounded-[8px] bg-superficie3 px-3 text-[13.5px] tracking-[.06em] text-texto disabled:opacity-60"
            >
              {apagando ? "…" : "Apagar"}
            </button>
          </>
        ) : (
          <>
            <span className="text-[15px] text-auxiliar">
              {ROTULO_ANGULO[foto.angulo]}
            </span>
            <button
              type="button"
              aria-label={`Apagar a foto de ${ROTULO_ANGULO[
                foto.angulo
              ].toLowerCase()} de ${porExtenso(foto.data)}`}
              onClick={() => setConfirmando(true)}
              className="-m-3 inline-flex shrink-0 p-3 text-auxiliar-fraco"
            >
              <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </button>
          </>
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
