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
  // `getClaims` e não `getUser`: confere o token com a chave pública, sem ir
  // ao servidor de autenticação a cada navegação (ver lib/supabase/auth.ts).
  // O token vencido continua sendo renovado aqui, pelo `getSession` de
  // dentro dele.
  const { data: sessao } = await supabase.auth.getClaims();
  const user = sessao?.claims?.sub ?? null;

  // A conta começa anônima no onboarding: a pessoa escreve as frases antes
  // de ter e-mail e senha, e no fim a conta anônima vira a dela, com tudo
  // dentro. RLS funciona igual (auth.uid() existe também para anônimos).
  //
  // **Só no onboarding, e depois da abertura.** Até 2026-10-29 a sessão
  // nascia em qualquer GET fora de uma lista de exceções, e a lista nunca
  // fechava: robô passando pela `/`, pré-visualização de link, o
  // `/apple-icon` que o iPhone pede, cada um virava uma conta no auth que
  // nunca chegava a existir no app. Eram 88. Pior: o Supabase limita a
  // criação de conta anônima por IP (30 por hora, no padrão), e esse lixo
  // dividia a cota com quem estava de fato chegando — numa rede de academia
  // ou atrás do NAT da operadora, a pessoa nova podia não conseguir começar.
  //
  // A abertura fica sem sessão porque é a porta de entrada: é para onde vai
  // a `/` sem conta, e o que robô e pré-visualização alcançam. A conta nasce
  // no primeiro passo depois dela, quando alguém tocou em começar.
  const caminho = request.nextUrl.pathname;
  const criaSessao =
    caminho.startsWith("/onboarding/") && caminho !== "/onboarding/abertura";

  // E só uma navegação de verdade abre sessão. Um HEAD de monitoramento ou
  // um prefetch não são alguém chegando — o prefetch busca só o esqueleto
  // da tela, que não depende de conta.
  const ehNavegacao =
    request.method === "GET" &&
    request.headers.get("next-router-prefetch") !== "1";

  if (!user && criaSessao && ehNavegacao) {
    await supabase.auth.signInAnonymously();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icone-).*)",
  ],
};
