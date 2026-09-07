"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Share, MoreVertical, SquarePlus } from "lucide-react";

type Plataforma = "ios" | "outra";

function detectarPlataforma(): Plataforma {
  if (typeof navigator === "undefined") return "outra";
  const ehIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return ehIOS ? "ios" : "outra";
}

function jaInstalado(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneIOS = (window.navigator as unknown as { standalone?: boolean })
    .standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    standaloneIOS === true
  );
}

export default function InstalarPage() {
  const [plataforma, setPlataforma] = useState<Plataforma | null>(null);
  const [instalado, setInstalado] = useState(false);

  // Detecção de plataforma/instalação depende de navigator e matchMedia,
  // inexistentes no servidor — precisa rodar só depois de montar no
  // cliente, senão o HTML do servidor nunca bateria com o do cliente.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlataforma(detectarPlataforma());
    setInstalado(jaInstalado());
  }, []);

  return (
    <div className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16">
      <div>
        <h1 className="text-[24px] leading-[1.4] text-texto">
          {instalado
            ? "Você já está com o app instalado."
            : "Adicione o app à tela de início"}
        </h1>

        {!instalado && plataforma === "ios" && (
          <div className="mt-8 flex flex-col gap-5 text-sm text-auxiliar">
            <p>
              No iPhone, as notificações do check-in noturno só chegam se o
              app estiver na sua tela de início. Leva 10 segundos:
            </p>
            <div className="flex items-center gap-3">
              <Share className="h-5 w-5 shrink-0 text-texto" strokeWidth={1.5} />
              <span>Toque no ícone de compartilhar, na barra do Safari.</span>
            </div>
            <div className="flex items-center gap-3">
              <SquarePlus className="h-5 w-5 shrink-0 text-texto" strokeWidth={1.5} />
              <span>Escolha &quot;Adicionar à Tela de Início&quot;.</span>
            </div>
          </div>
        )}

        {!instalado && plataforma === "outra" && (
          <div className="mt-8 flex flex-col gap-5 text-sm text-auxiliar">
            <p>
              Para receber as notificações do check-in noturno, adicione o
              app à tela de início:
            </p>
            <div className="flex items-center gap-3">
              <MoreVertical
                className="h-5 w-5 shrink-0 text-texto"
                strokeWidth={1.5}
              />
              <span>Abra o menu do navegador.</span>
            </div>
            <div className="flex items-center gap-3">
              <SquarePlus className="h-5 w-5 shrink-0 text-texto" strokeWidth={1.5} />
              <span>Toque em &quot;Instalar app&quot; ou &quot;Adicionar à tela inicial&quot;.</span>
            </div>
          </div>
        )}

        {!instalado && (
          <p className="mt-8 text-sm text-auxiliar">
            Se preferir não fazer isso agora, o app continua funcionando
            normalmente — só as notificações noturnas não vão chegar.
          </p>
        )}
      </div>

      <Link
        href="/"
        className="tipo-rotulo w-full rounded-[6px] bg-acento py-3 text-center text-[16px] tracking-[.09em] text-fundo"
      >
        Concluir
      </Link>
    </div>
  );
}
