import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarEstadoRitual } from "@/lib/ritual/dados";
import { buscarGravacoes } from "@/lib/gravacoes/dados";
import {
  FUNCOES,
  FRASES_PADRAO,
  ROTULOS_FUNCAO,
  textoCompleto,
} from "@/lib/frases/modelo";
import LoopDeVoz from "./LoopDeVoz";

export default async function LoopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [estado, gravacoes] = await Promise.all([
    buscarEstadoRitual(supabase, user.id),
    buscarGravacoes(supabase, user.id),
  ]);

  // Só entram as frases que a pessoa gravou. A ordem é a das cinco.
  const itens = FUNCOES.filter((funcao) => gravacoes[funcao]).map((funcao) => {
    const frase = estado.frases[funcao];
    return {
      rotulo: ROTULOS_FUNCAO[funcao],
      texto: frase ? textoCompleto(frase) : FRASES_PADRAO[funcao].texto,
      url: gravacoes[funcao] as string,
    };
  });

  if (itens.length === 0) {
    return (
      <div className="flex grow flex-col gap-8 px-6 pb-10 pt-6">
        <Link
          href="/ritual"
          aria-label="Voltar"
          className="-m-3 inline-flex self-start p-3 text-auxiliar"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>

        <div className="flex flex-col gap-3">
          <h1 className="text-[24px] leading-[1.3] text-texto">
            Ainda não há voz para tocar.
          </h1>
          <p className="text-[15px] leading-[1.6] text-auxiliar">
            Grave uma das cinco frases na Tela do Ritual — em cada frase há
            um botão GRAVAR. Depois volte aqui e elas tocam em sequência, na
            sua voz, enquanto você faz outra coisa.
          </p>
        </div>
      </div>
    );
  }

  return <LoopDeVoz itens={itens} musicaUrl={estado.musica?.url ?? null} />;
}
