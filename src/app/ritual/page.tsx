import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoRitual } from "@/lib/ritual/dados";
import { buscarGravacoes } from "@/lib/gravacoes/dados";
import Cabecalho from "@/components/ritual/Cabecalho";
import MusicaPlayer from "@/components/ritual/MusicaPlayer";
import BotaoEspelho from "@/components/ritual/BotaoEspelho";
import FrasesRitual from "@/components/ritual/FrasesRitual";
import InegociaveisSecao from "@/components/ritual/InegociaveisSecao";
import LinhaDoDia from "@/components/ritual/LinhaDoDia";
import Revelar from "@/components/movimento/Revelar";

const CAMINHO = "/ritual";

export default async function RitualPage({
  searchParams,
}: {
  searchParams: Promise<{ foco?: string; editarIdentidade?: string }>;
}) {
  const { foco, editarIdentidade } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Cobre quem chega direto no Ritual sem passar pelo onboarding — o
  // acesso por e-mail está desligado por enquanto, então essa é a única
  // garantia de que a linha em `usuarios` e as 5 frases padrão existem.
  await garantirUsuarioEFrasesPadrao(supabase, user);

  const [estado, gravacoes] = await Promise.all([
    buscarEstadoRitual(supabase, user.id),
    buscarGravacoes(supabase, user.id),
  ]);

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
      dataHoje={estado.dataRitual}
      caminhoAtual={CAMINHO}
    />
  );
  const linhaDoDia = (
    <LinhaDoDia
      modo={estado.modo}
      linhaHoje={estado.linhaHoje}
      linhaOntem={estado.linhaOntem}
      feitoOntem={estado.feitoOntem}
      feitoHoje={estado.feitoHoje}
      dataHoje={estado.dataRitual}
      caminhoAtual={CAMINHO}
      focoInicial={foco === "linha"}
    />
  );
  const frases = (
    <FrasesRitual
      frases={estado.frases}
      gravacoes={gravacoes}
      recolhidas={estado.modo === "noite"}
      caminhoAtual={CAMINHO}
      editarIdentidadeInicial={editarIdentidade === "1"}
    />
  );

  const bgTemperatura =
    estado.modo === "manha" ? "temperatura-manha" : "temperatura-noite";

  // Ordem das seções é fixa (manhã e noite) — só o fundo e o conteúdo
  // interno de cada seção mudam com o horário. Ver README do handoff:
  // "Tela do Ritual", lista 1-8.
  return (
    <div
      className={`flex grow flex-col gap-7 px-6 pb-[26px] pt-8 transition-colors duration-[600ms] ${bgTemperatura}`}
    >
      <Revelar imediato y={14} desfoque={4}>
        {cabecalho}
      </Revelar>
      <Revelar imediato atraso={90} y={14} desfoque={4}>
        <MusicaPlayer musica={estado.musica} />
      </Revelar>
      <Revelar imediato atraso={160}>
        <BotaoEspelho />
      </Revelar>
      <Revelar imediato atraso={240}>{frases}</Revelar>
      <Revelar>{inegociaveis}</Revelar>
      <Revelar>{linhaDoDia}</Revelar>
    </div>
  );
}
