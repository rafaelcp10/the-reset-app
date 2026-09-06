import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import ProgressoOnboarding from "@/components/onboarding/ProgressoOnboarding";

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);

  return (
    <div className="flex min-h-screen flex-col">
      <ProgressoOnboarding />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
