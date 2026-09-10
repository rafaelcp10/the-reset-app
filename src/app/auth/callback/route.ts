import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding/abertura";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await garantirUsuarioEFrasesPadrao(supabase, data.user);
      return NextResponse.redirect(`${origin}${next}`);
    }

    // Chegou o código e a troca falhou: quase sempre é o segredo do PKCE
    // que ficou no outro lado. O app instalado guarda cookie separado do
    // navegador, então a ida para o Google acontece num armazenamento e a
    // volta em outro — e aqui não existe verifier nenhum para casar com o
    // código. Antes isso caía num /login mudo, e a pessoa concluía, com
    // razão, que o app tinha quebrado.
    return NextResponse.redirect(`${origin}/login?erro=google_sem_volta`);
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
}
