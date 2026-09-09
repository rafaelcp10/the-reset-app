import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AjustesForm from "./AjustesForm";
import GuardarAcesso from "./GuardarAcesso";

export default async function AjustesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("horario_checkin, lembrete_ativo, reps_padrao, modo_maos_livres")
    .eq("id", user.id)
    .maybeSingle();

  // `email` já vem preenchido assim que a pessoa pede o vínculo; o que
  // diz se a conta é mesmo recuperável é a confirmação pelo link.
  const emailAtual = user.email ?? user.new_email ?? null;
  const contaGuardada = Boolean(user.email_confirmed_at) && !user.is_anonymous;

  return (
    <AjustesForm
      horarioInicial={usuario?.horario_checkin?.slice(0, 5) || "21:30"}
      lembreteInicial={usuario?.lembrete_ativo ?? true}
      repsInicial={usuario?.reps_padrao ?? 3}
      maosLivresInicial={usuario?.modo_maos_livres ?? false}
      // A chave pública do VAPID precisa chegar ao navegador para assinar
      // a inscrição; a privada nunca sai do servidor.
      chaveVapid={process.env.VAPID_PUBLIC_KEY ?? ""}
      guardarAcesso={
        <GuardarAcesso emailAtual={emailAtual} confirmado={contaGuardada} />
      }
    />
  );
}
