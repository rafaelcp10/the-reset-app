import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Necessário para manter a sessão válida — dispara o refresh do token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sem login por e-mail por enquanto: todo visitante ganha uma sessão
  // anônima na hora, sem precisar digitar e-mail nem esperar link. RLS
  // continua funcionando normalmente (auth.uid() existe também pra
  // usuários anônimos) — os dados de cada visitante continuam isolados.
  //
  // Só que isso vale para quem está navegando. Numa rota de API, criar
  // sessão na marra faria cada batida de robô virar um usuário novo no
  // banco — e ainda faria o endpoint responder como se houvesse alguém
  // logado. Lá a ausência de sessão precisa continuar sendo ausência.
  // O mesmo vale para as páginas públicas de privacidade e termos: elas
  // são abertas pelo Google na tela de consentimento e por qualquer
  // rastreador, e nada nelas depende de sessão.
  const caminho = request.nextUrl.pathname;
  const semSessao =
    caminho.startsWith("/api/") ||
    caminho.startsWith("/privacidade") ||
    caminho.startsWith("/termos");

  if (!user && !semSessao) {
    await supabase.auth.signInAnonymously();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icone-).*)",
  ],
};
