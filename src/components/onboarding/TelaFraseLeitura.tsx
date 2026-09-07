import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarFrasesAtuais } from "@/lib/frases/dados";
import {
  FRASES_PADRAO,
  FUNCOES,
  ROTULOS_FUNCAO,
  type Funcao,
} from "@/lib/frases/modelo";
import FraseLeituraEditavel from "@/components/frases/FraseLeituraEditavel";
import { salvarEdicaoFrase } from "@/lib/frases/acoes";
import AvancarAoTocar from "./AvancarAoTocar";

export default async function TelaFraseLeitura({
  funcao,
  caminhoAtual,
  proximaRota,
}: {
  funcao: Funcao;
  caminhoAtual: string;
  proximaRota: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const frases = await buscarFrasesAtuais(supabase, user.id);
  const texto = frases[funcao]?.texto ?? FRASES_PADRAO[funcao].texto;
  const numero = FUNCOES.indexOf(funcao) + 1;

  return (
    <AvancarAoTocar proximaRota={proximaRota}>
      <div className="flex flex-col gap-4">
        <span className="tipo-rotulo text-[9px] tracking-[.22em] text-auxiliar">
          {ROTULOS_FUNCAO[funcao]} · {numero} de {FUNCOES.length}
        </span>
        <div onClick={(e) => e.stopPropagation()}>
          <FraseLeituraEditavel
            textoAtual={texto}
            textoPadrao={FRASES_PADRAO[funcao].texto}
            acaoSalvar={salvarEdicaoFrase.bind(null, funcao, caminhoAtual)}
          />
        </div>
      </div>
      <p className="text-[13.5px] text-auxiliar">Um toque avança.</p>
    </AvancarAoTocar>
  );
}
