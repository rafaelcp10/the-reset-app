import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AjustesForm from "./AjustesForm";

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

  return (
    <AjustesForm
      horarioInicial={usuario?.horario_checkin?.slice(0, 5) || "21:30"}
      lembreteInicial={usuario?.lembrete_ativo ?? true}
      repsInicial={usuario?.reps_padrao ?? 3}
      maosLivresInicial={usuario?.modo_maos_livres ?? false}
    />
  );
}
