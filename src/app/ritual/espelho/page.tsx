import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoRitual, buscarIntencao } from "@/lib/ritual/dados";
import { diaAnteriorISO } from "@/lib/ritual/tempo";
import { buscarGravacoes } from "@/lib/gravacoes/dados";
import { buscarEstadoTodo } from "@/lib/todo/dados";
import {
  FUNCOES,
  FRASES_PADRAO,
  ROTULOS_FUNCAO,
  textoCompleto,
} from "@/lib/frases/modelo";
import ModoEspelho from "./ModoEspelho";

export default async function EspelhoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);

  const [estado, gravacoes, todo] = await Promise.all([
    buscarEstadoRitual(supabase, user.id),
    buscarGravacoes(supabase, user.id),
    buscarEstadoTodo(supabase, user.id),
  ]);

  // O que a pessoa disse ontem à noite que faria hoje.
  const ditoOntem = await buscarIntencao(
    supabase,
    user.id,
    diaAnteriorISO(estado.dataRitual),
  );

  // Só as tarefas de hoje ainda não feitas. Os inegociáveis ficam de fora
  // de propósito: eles são o que não muda na semana e já estão decididos —
  // não são candidatos a "linha do dia", que é justamente o que varia.
  // Misturar os dois numa lista só apagaria a distinção que o app inteiro
  // existe para manter.
  const tarefasDeHoje = todo.hoje
    .filter((item) => !item.feito)
    .map((item) => item.tarefa.texto);

  const itens = FUNCOES.map((funcao) => {
    const frase = estado.frases[funcao];
    return {
      rotulo: ROTULOS_FUNCAO[funcao],
      texto: frase ? textoCompleto(frase) : FRASES_PADRAO[funcao].texto,
      palavraEscolhida:
        funcao === "identidade" ? (frase?.preenchimento_lacuna ?? null) : null,
      urlGravacao: gravacoes[funcao],
    };
  });

  return (
    <ModoEspelho
      frases={itens}
      musicaUrl={estado.musica?.url ?? null}
      musicaNome={estado.musica?.nome ?? null}
      repeticoesIniciais={estado.repsPadrao}
      maosLivresInicial={estado.modoMaosLivres}
      dataHoje={estado.dataRitual}
      tarefasDeHoje={tarefasDeHoje}
      ditoOntem={ditoOntem}
    />
  );
}
