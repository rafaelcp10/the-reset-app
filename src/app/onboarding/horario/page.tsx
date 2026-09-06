import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HorarioForm from "./HorarioForm";

const HORARIO_PADRAO = "21:00";

export default async function HorarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("horario_checkin")
    .eq("id", user.id)
    .maybeSingle();

  const horarioInicial = usuario?.horario_checkin?.slice(0, 5) || HORARIO_PADRAO;

  return <HorarioForm horarioInicial={horarioInicial} />;
}
