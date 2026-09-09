import { ImageResponse } from "next/og";
import { desenharIcone } from "@/lib/ui/icone";

export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(desenharIcone(192), { width: 192, height: 192 });
}
