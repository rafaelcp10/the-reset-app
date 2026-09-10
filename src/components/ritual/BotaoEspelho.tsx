"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { destravarAudio } from "@/lib/ui/sensorial";

/**
 * A porta do Espelho — e o gesto que destrava o áudio.
 *
 * O iOS só libera som depois de um toque, e a respiração é a última tela
 * onde faz sentido pedir um: ela existe para a pessoa não tocar em nada.
 * Como a navegação daqui para lá é do lado do cliente, o contexto de
 * áudio destravado neste toque atravessa e chega vivo na respiração.
 */
export default function BotaoEspelho() {
  return (
    <Link
      href="/ritual/espelho"
      onPointerDown={destravarAudio}
      className="botao-acento tipo-rotulo flex w-full items-center justify-center gap-2 rounded-[10px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
    >
      <Maximize2 className="h-4 w-4" strokeWidth={2} />
      Entrar no espelho
    </Link>
  );
}
