import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormularioConta from "./FormularioConta";

/**
 * Quem já tem conta não é convidado a criar outra.
 *
 * Sem essa porta, quem entrou com e-mail e senha e caiu no onboarding —
 * porque nunca escolheu a palavra da frase 1, por exemplo — chegava aqui
 * e batia em "esse e-mail já tem conta". A conta era a dele mesmo.
 */
export default async function ContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !user.is_anonymous && user.email) {
    redirect("/onboarding/perfil");
  }

  return <FormularioConta />;
}
