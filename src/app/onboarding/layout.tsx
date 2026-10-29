import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/supabase/auth";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import ProgressoOnboarding from "@/components/onboarding/ProgressoOnboarding";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);

  // Sem sessão, a tela aparece assim mesmo: é o caso da abertura, que é a
  // porta de entrada e não cria conta (ver proxy.ts). Até 2026-10-29 isto
  // mandava para o login, e quem estava no login e tocava em começar
  // voltava para o login. Os passos que guardam alguma coisa conferem a
  // sessão eles mesmos.
  if (user) await garantirUsuarioEFrasesPadrao(supabase, user);

  return (
    <div className="flex min-h-screen flex-col">
      <ProgressoOnboarding />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
