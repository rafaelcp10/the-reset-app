import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoRitual } from "@/lib/ritual/dados";
import { FRASES_PADRAO } from "@/lib/frases/modelo";
import Cabecalho from "@/components/ritual/Cabecalho";
import MusicaPlayer from "@/components/ritual/MusicaPlayer";
import BotaoEspelho from "@/components/ritual/BotaoEspelho";
import FraseIdentidadeRitual from "@/components/frases/FraseIdentidadeRitual";

const CAMINHO = "/";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);
  const estado = await buscarEstadoRitual(supabase, user.id);
  const identidade = estado.frases.identidade;

  return (
    <div className="flex flex-col gap-8 px-6 pb-10 pt-10">
      <Cabecalho
        modo={estado.modo}
        dataExtenso={estado.dataExtenso}
        numeroSemana={estado.numeroSemana}
      />

      <MusicaPlayer musica={estado.musica} caminhoAtual={CAMINHO} />

      <FraseIdentidadeRitual
        textoBase={identidade?.texto ?? FRASES_PADRAO.identidade.texto}
        preenchimento={identidade?.preenchimento_lacuna ?? ""}
        caminhoAtual={CAMINHO}
      />

      <BotaoEspelho />

      <PreviaBloqueada
        titulo="To-do"
        texto="As tarefas do dia, separadas dos inegociáveis."
      />
      <PreviaBloqueada
        titulo="Objetivos"
        texto="O que você está construindo em meses, não em dias."
      />
    </div>
  );
}

function PreviaBloqueada({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-auxiliar">
        {titulo}
      </h2>
      <p className="text-sm text-auxiliar/70">{texto}</p>
    </div>
  );
}
