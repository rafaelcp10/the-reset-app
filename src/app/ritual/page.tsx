import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoRitual } from "@/lib/ritual/dados";
import Cabecalho from "@/components/ritual/Cabecalho";
import MusicaPlayer from "@/components/ritual/MusicaPlayer";
import BotaoEspelho from "@/components/ritual/BotaoEspelho";
import FrasesRitual from "@/components/ritual/FrasesRitual";
import InegociaveisSecao from "@/components/ritual/InegociaveisSecao";
import LinhaDoDia from "@/components/ritual/LinhaDoDia";

const CAMINHO = "/ritual";

export default async function RitualPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cobre quem chega direto no Ritual sem passar pelo onboarding — o
  // acesso por e-mail está desligado por enquanto, então essa é a única
  // garantia de que a linha em `usuarios` e as 5 frases padrão existem.
  await garantirUsuarioEFrasesPadrao(supabase, user);

  const estado = await buscarEstadoRitual(supabase, user.id);

  const cabecalho = (
    <Cabecalho
      modo={estado.modo}
      dataExtenso={estado.dataExtenso}
      numeroSemana={estado.numeroSemana}
    />
  );
  const inegociaveis = (
    <InegociaveisSecao
      inegociaveis={estado.inegociaveis}
      semanaInicio={estado.semanaInicio}
      dataHoje={estado.dataRitual}
      caminhoAtual={CAMINHO}
    />
  );
  const linhaDoDia = (
    <LinhaDoDia
      modo={estado.modo}
      linhaHoje={estado.linhaHoje}
      linhaOntem={estado.linhaOntem}
      feitoHoje={estado.feitoHoje}
      dataHoje={estado.dataRitual}
      caminhoAtual={CAMINHO}
    />
  );
  const frases = (
    <FrasesRitual
      frases={estado.frases}
      recolhidas={estado.modo === "noite"}
      caminhoAtual={CAMINHO}
    />
  );

  if (estado.modo === "manha") {
    return (
      <div className="flex flex-col gap-8 px-6 pb-10 pt-10">
        {cabecalho}
        <MusicaPlayer musica={estado.musica} caminhoAtual={CAMINHO} />
        <BotaoEspelho />
        {frases}
        {inegociaveis}
        {linhaDoDia}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 px-6 pb-6 pt-6">
      <div className="flex flex-col gap-6">
        {inegociaveis}
        {linhaDoDia}
      </div>
      {frases}
      <BotaoEspelho />
      <MusicaPlayer musica={estado.musica} caminhoAtual={CAMINHO} />
      {cabecalho}
    </div>
  );
}
