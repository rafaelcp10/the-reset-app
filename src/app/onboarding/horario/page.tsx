import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/supabase/auth";
import HorarioForm from "./HorarioForm";

const HORARIO_PADRAO = "21:30";

export default async function HorarioPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("horario_checkin")
    .eq("id", user.id)
    .maybeSingle();

  const horarioInicial = usuario?.horario_checkin?.slice(0, 5) || HORARIO_PADRAO;

  return <HorarioForm horarioInicial={horarioInicial} />;
}
