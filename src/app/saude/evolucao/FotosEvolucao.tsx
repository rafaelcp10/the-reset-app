"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, X } from "lucide-react";
import { apagarFoto, salvarFoto } from "@/lib/saude/acoes";
import type { ParDeFotos } from "@/lib/saude/fotos";

/** Lado maior depois da redução. Suficiente para a tela, longe dos 4MB. */
const LADO_MAXIMO = 1200;
const QUALIDADE = 0.82;

/**
 * Antes e depois.
 *
 * A única imagem do app inteiro, e exceção escrita no CLAUDE.md: não é
 * ilustração nem decoração, é dado do usuário — a foto diz o que 4 pontos
 * percentuais não dizem.
 *
 * A redução acontece aqui, antes de qualquer envio: foto de celular crua
 * passa de 4MB, e o que sobe é um JPEG de 1200px no lado maior. Serve à
 * tela e, de quebra, é menos foto de corpo trafegando do que o necessário.
 */
export default function FotosEvolucao({
  data,
  fotos,
}: {
  data: string;
  fotos: ParDeFotos;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [apagando, iniciarApagar] = useTransition();

  async function aoEscolher(arquivo: File | undefined) {
    if (!arquivo) return;
    setErro(null);
    setEnviando(true);
    try {
      const reduzida = await reduzir(arquivo);
      const corpo = new FormData();
      corpo.append("foto", reduzida, "foto.jpg");
      await salvarFoto(data, corpo);
    } catch {
      // Vermelho aqui é legítimo: falha de upload é erro de sistema, não
      // comportamento do usuário.
      setErro("Não deu para guardar a foto. Tenta de novo.");
    } finally {
      setEnviando(false);
      if (entrada.current) entrada.current.value = "";
    }
  }

  const ocupado = enviando || apagando;

  return (
    <div className="bloco flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="tipo-rotulo text-[12.5px] tracking-[.18em] text-auxiliar">
          Antes e depois
        </h2>
        {fotos.total > 2 && (
          <span className="text-[14px] text-auxiliar-fraco">
            {fotos.total} fotos
          </span>
        )}
      </div>

      {fotos.antes ? (
        <div className="grid grid-cols-2 gap-3">
          <Quadro rotulo="Antes" foto={fotos.antes} />
          {fotos.depois ? (
            <Quadro rotulo="Depois" foto={fotos.depois} />
          ) : (
            <div className="flex flex-col gap-1.5">
              <span className="tipo-rotulo text-[12.5px] tracking-[.2em] text-auxiliar-fraco">
                Depois
              </span>
              <div className="flex aspect-[3/4] items-center justify-center rounded-[10px] bg-superficie3 px-3 text-center text-[14px] leading-[1.5] text-auxiliar-fraco">
                A próxima foto entra aqui
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[15.5px] leading-[1.6] text-auxiliar">
          Uma foto agora, outra daqui a alguns meses. É o que os números não
          conseguem mostrar.
        </p>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void aoEscolher(e.target.files?.[0])}
      />

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={ocupado}
          onClick={() => entrada.current?.click()}
          className="tipo-rotulo inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-superficie3 px-4 text-[13px] tracking-[.09em] text-texto disabled:opacity-60"
        >
          <Camera className="h-[18px] w-[18px]" strokeWidth={1.5} />
          {enviando
            ? "Guardando…"
            : fotos.hoje
              ? "Trocar a foto de hoje"
              : "Tirar a foto de hoje"}
        </button>

        {fotos.hoje && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => iniciarApagar(() => void apagarFoto(data))}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 text-[14.5px] text-auxiliar disabled:opacity-60"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Apagar a de hoje
          </button>
        )}
      </div>

      {erro && <p className="text-[14.5px] text-erro">{erro}</p>}

      <p className="text-[14px] leading-[1.6] text-auxiliar-fraco">
        Fica guardada só para você, em pasta privada, e some junto com a
        conta se você apagar a conta.
      </p>
    </div>
  );
}

function Quadro({ rotulo, foto }: { rotulo: string; foto: { data: string; url: string | null } }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="tipo-rotulo text-[12.5px] tracking-[.2em] text-auxiliar-fraco">
        {rotulo}
      </span>
      <div className="aspect-[3/4] overflow-hidden rounded-[10px] bg-superficie3">
        {foto.url && (
          // URL assinada e privada: passar pelo otimizador do Next colocaria
          // foto de corpo num cache que não é do usuário.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto.url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
      </div>
      <span className="text-[14px] text-auxiliar">{dataCurta(foto.data)}</span>
    </div>
  );
}

function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano.slice(2)}`;
}

/**
 * Redesenha a foto num canvas, reduzida e em JPEG.
 *
 * `imageOrientation: "from-image"` é o que impede a foto do iPhone de
 * chegar deitada: o EXIF de rotação se perde ao redesenhar, então ele
 * precisa ser aplicado na leitura.
 */
async function reduzir(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo, {
    imageOrientation: "from-image",
  });

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;

  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("sem canvas");
  contexto.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolver) =>
    canvas.toBlob(resolver, "image/jpeg", QUALIDADE),
  );
  if (!blob) throw new Error("sem blob");
  return blob;
}
