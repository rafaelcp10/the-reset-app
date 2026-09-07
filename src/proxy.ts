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
  if (!user) {
    await supabase.auth.signInAnonymously();
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest).*)"],
};
