import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { agoraNoFuso, dataRitual } from "@/lib/ritual/tempo";

export const dynamic = "force-dynamic";

/**
 * Resolve o check-in a partir dos botões da notificação. O service worker
 * chama isto com os cookies da sessão, então vale o RLS normal — nada de
 * chave de serviço aqui.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "sem sessão" }, { status: 401 });
  }

  let corpo: { feito?: boolean; data?: string | null } = {};
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  if (typeof corpo.feito !== "boolean") {
    return NextResponse.json({ erro: "faltou o feito" }, { status: 400 });
  }

  // A notificação carrega o dia que ela representa; se vier sem, o dia é
  // calculado agora no fuso do usuário.
  let dia = corpo.data ?? null;
  if (!dia) {
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("fuso")
      .eq("id", user.id)
      .maybeSingle();
    dia = dataRitual(agoraNoFuso(usuario?.fuso || "UTC"));
  }

  await supabase.from("dias").upsert(
    {
      usuario_id: user.id,
      data: dia,
      feito: corpo.feito,
      registrado_em: new Date().toISOString(),
    },
    { onConflict: "usuario_id,data" },
  );

  return NextResponse.json({ ok: true, data: dia });
}
