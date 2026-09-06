import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarEstadoRitual } from "@/lib/ritual/dados";
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

  const estado = await buscarEstadoRitual(supabase, user.id);

  const itens = FUNCOES.map((funcao) => {
    const frase = estado.frases[funcao];
    return {
      rotulo: ROTULOS_FUNCAO[funcao],
      texto: frase ? textoCompleto(frase) : FRASES_PADRAO[funcao].texto,
    };
  });

  return (
    <ModoEspelho
      frases={itens}
      musicaUrl={estado.musica?.url ?? null}
      repeticoesIniciais={estado.repsPadrao}
      maosLivresInicial={estado.modoMaosLivres}
      linhaHojeInicial={estado.linhaHoje}
      dataHoje={estado.dataRitual}
    />
  );
}
