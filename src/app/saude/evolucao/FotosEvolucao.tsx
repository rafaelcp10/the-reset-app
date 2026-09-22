"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Camera, Check, Images, RotateCw } from "lucide-react";
import { salvarFoto } from "@/lib/saude/acoes";
import {
  ANGULOS,
  ROTULO_ANGULO,
  type Angulo,
  type ConjuntoDeFotos,
  type Foto,
} from "@/lib/saude/fotos";

/** Lado maior depois da redução. Suficiente para a tela, longe dos 4MB. */
const LADO_MAXIMO = 1200;
const QUALIDADE = 0.82;

/**
 * Antes e depois, nos quatro ângulos.
 *
 * A única imagem do app inteiro, e exceção escrita no CLAUDE.md: não é
 * ilustração nem decoração, é dado do usuário — a foto diz o que 4 pontos
 * percentuais não dizem.
 *
 * O botão gira o par inteiro de uma vez. Antes e depois sempre mostram o
 * mesmo ângulo, porque comparar a frente de hoje com as costas de três
 * meses atrás não diria nada.
 *
 * A redução acontece aqui, antes de qualquer envio: foto de celular crua
 * passa de 4MB, e o que sobe é um JPEG de 1200px no lado maior. Serve à
 * tela e, de quebra, é menos foto de corpo trafegando do que o necessário.
 *
 * Aqui só se acrescenta e se troca. Apagar mora na galeria, onde a foto
 * aparece grande e com a data — apagar sem ver o que se apaga é como se
 * perde a foto de um ano atrás.
 */
export default function FotosEvolucao({
  data,
  fotos,
}: {
  data: string;
  fotos: ConjuntoDeFotos;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [angulo, setAngulo] = useState<Angulo>("frente");
  const [enviando, setEnviando] = useState<Angulo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const par = fotos.porAngulo[angulo];

  function girar() {
    const proximo = (ANGULOS.indexOf(angulo) + 1) % ANGULOS.length;
    setAngulo(ANGULOS[proximo]);
  }

  function pedirFoto(alvo: Angulo) {
    setAngulo(alvo);
    // O input é um só e serve aos quatro: `capture` fica de fora de
    // propósito, para caber também a foto que já está no rolo da câmera.
    entrada.current?.setAttribute("data-angulo", alvo);
    entrada.current?.click();
  }

  async function aoEscolher(arquivo: File | undefined) {
    const alvo = entrada.current?.getAttribute("data-angulo") as Angulo | null;
    if (!arquivo || !alvo) return;
    setErro(null);
    setEnviando(alvo);
    try {
      const reduzida = await reduzir(arquivo);
      const corpo = new FormData();
      corpo.append("foto", reduzida, "foto.jpg");
      await salvarFoto(data, alvo, corpo);
    } catch {
      // Vermelho aqui é legítimo: falha de upload é erro de sistema, não
      // comportamento do usuário.
      setErro("Não deu para guardar a foto. Tenta de novo.");
    } finally {
      setEnviando(null);
      if (entrada.current) entrada.current.value = "";
    }
  }

  return (
    <div className="bloco flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
          Antes e depois
        </h2>

        {fotos.total > 0 && (
          <button
            type="button"
            onClick={girar}
            aria-label={`Girar. Mostrando ${ROTULO_ANGULO[angulo].toLowerCase()}.`}
            className="tipo-rotulo -mr-1 inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-2 text-[13.5px] tracking-[.06em] text-texto"
          >
            <RotateCw className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {ROTULO_ANGULO[angulo]}
          </button>
        )}
      </div>

      {fotos.total === 0 ? (
        <p className="text-[16px] leading-[1.6] text-auxiliar">
          Quatro fotos: frente, um lado, costas, o outro lado. Outras quatro
          daqui a um mês. É o que os números não conseguem mostrar.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Quadro rotulo="Antes" foto={par.antes} />
          <Quadro rotulo="Depois" foto={par.depois} />
        </div>
      )}

      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void aoEscolher(e.target.files?.[0])}
      />

      <div className="flex flex-col gap-2">
        <span className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar-fraco">
          Hoje
        </span>
        {/* Quatro alvos em grade, e não quatro numa linha: "Lado esquerdo"
            não cabe em 75px, e abreviar viraria charada. */}
        <div className="grid grid-cols-2 gap-2">
          {ANGULOS.map((a) => (
            <button
              key={a}
              type="button"
              disabled={enviando !== null}
              onClick={() => pedirFoto(a)}
              className={`inline-flex min-h-11 items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-left text-[15.5px] transition-colors duration-200 disabled:opacity-60 ${
                fotos.hoje[a]
                  ? "bg-superficie3 text-texto"
                  : "bg-superficie3/40 text-auxiliar"
              }`}
            >
              {ROTULO_ANGULO[a]}
              {enviando === a ? (
                <span className="shrink-0 text-[13.5px] text-auxiliar">…</span>
              ) : fotos.hoje[a] ? (
                // Sem âmbar: o acento desta tela são as curvas, e o fundo
                // aceso do botão já diz que este ângulo foi tirado.
                <Check
                  className="h-[18px] w-[18px] shrink-0 text-texto"
                  strokeWidth={2}
                />
              ) : (
                <Camera
                  className="h-[18px] w-[18px] shrink-0 text-auxiliar-fraco"
                  strokeWidth={1.5}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {erro && <p className="text-[15.5px] text-erro">{erro}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] leading-[1.6] text-auxiliar-fraco">
          Guardadas só para você, em pasta privada.
        </p>
        {fotos.total > 0 && (
          <Link
            href="/saude/evolucao/fotos"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[15.5px] text-auxiliar"
          >
            <Images className="h-[18px] w-[18px]" strokeWidth={1.5} />
            Ver todas
          </Link>
        )}
      </div>
    </div>
  );
}

function Quadro({ rotulo, foto }: { rotulo: string; foto: Foto | null }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="tipo-rotulo text-[13.5px] tracking-[.12em] text-auxiliar-fraco">
        {rotulo}
      </span>
      <div className="aspect-[3/4] overflow-hidden rounded-[10px] bg-superficie3">
        {foto?.url ? (
          // URL assinada e privada: passar pelo otimizador do Next colocaria
          // foto de corpo num cache que não é do usuário.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto.url}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-[15px] leading-[1.5] text-auxiliar-fraco">
            {rotulo === "Antes"
              ? "Sem foto neste ângulo"
              : "A próxima entra aqui"}
          </div>
        )}
      </div>
      <span className="text-[15px] text-auxiliar">
        {foto ? dataCurta(foto.data) : "—"}
      </span>
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

  const escala = Math.min(
    1,
    LADO_MAXIMO / Math.max(bitmap.width, bitmap.height),
  );
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
