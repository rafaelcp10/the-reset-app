import { ImageResponse } from "next/og";
import { desenharIcone } from "@/lib/ui/icone";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Ícone da tela de início no iPhone — onde o app precisa estar para as
 *  notificações chegarem. */
export default function AppleIcon() {
  return new ImageResponse(desenharIcone(180), size);
}
