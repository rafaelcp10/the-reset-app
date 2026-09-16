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

  // Quem nunca escolheu a palavra da frase 1 nunca foi conduzido: manda
  // para o onboarding em vez de largar na tela com as frases padrão.
  //
  // A pergunta vem depois da busca, e não antes, porque a resposta já vem
  // dentro dela: perguntar ao banco de novo era uma travessia de rede
  // inteira para reler uma coluna que já estava na mão.
  if (!estado.frases.identidade?.preenchimento_lacuna?.trim()) {
    redirect("/onboarding/abertura");
  }

  const cabecalho = (
    <Cabecalho
      modo={estado.modo}
      nome={estado.nome}
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
      intencaoAmanha={estado.intencaoHoje}
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

  const moldura = `flex grow flex-col gap-7 px-6 pb-[26px] pt-8 transition-colors duration-[600ms] ${bgTemperatura}`;

  /*
   * A tela inverte à noite, e isso é desenho, não descuido.
   *
   * De manhã a pessoa chega para começar: a saudação abre, a música entra,
   * e o Espelho é o próximo passo. À noite ela chega para fechar o dia —
   * então o que ela veio marcar está no topo, e a saudação, que já cumpriu
   * seu papel de manhã, afunda para o fim.
   *
   * Eu já unifiquei as duas ordens uma vez, achando que cabeçalho embaixo
   * era erro. Não era. Fica registrado para ninguém "consertar" de novo.
   */
  if (estado.modo === "noite") {
    return (
      <div className={moldura}>
        <Revelar imediato y={14} desfoque={4} className="flex flex-col gap-6">
          {inegociaveis}
          {linhaDoDia}
        </Revelar>
        <Revelar imediato atraso={160}>{frases}</Revelar>
        <Revelar atraso={40}>
          <BotaoEspelho />
        </Revelar>
        <Revelar atraso={80}>
          <MusicaPlayer musica={estado.musica} />
        </Revelar>
        <Revelar atraso={120}>{cabecalho}</Revelar>
      </div>
    );
  }

  return (
    <div className={moldura}>
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
