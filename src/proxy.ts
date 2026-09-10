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
  // Criar sessão em qualquer rota enchia o banco de contas órfãs: cada
  // batida em /login, na abertura do onboarding ou numa página pública
  // virava um usuário no auth que nunca chegava a existir no app.
  //
  // A sessão nasce só onde ela é realmente necessária — nas telas que
  // guardam o que a pessoa escreve. Entrar, recuperar senha e ler os
  // documentos públicos não precisam de conta nenhuma.
  const caminho = request.nextUrl.pathname;
  const SEM_SESSAO = [
    "/api/",
    "/login",
    "/recuperar",
    "/auth",
    "/offline",
    "/privacidade",
    "/termos",
    "/onboarding/abertura",
  ];
  const dispensaSessao = SEM_SESSAO.some((prefixo) =>
    caminho.startsWith(prefixo),
  );

  if (!user && !dispensaSessao) {
    await supabase.auth.signInAnonymously();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icone-).*)",
  ],
};
