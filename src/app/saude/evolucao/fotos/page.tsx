import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarFotosPorDia } from "@/lib/saude/fotos";
import Revelar from "@/components/movimento/Revelar";
import DiaDeFotos from "./DiaDeFotos";

/**
 * As fotos antigas, do dia mais novo para o mais antigo.
 *
 * O dia é a unidade porque é assim que a sessão acontece: quatro ângulos de
 * uma vez. Uma lista corrida misturaria as costas de hoje com a frente de
 * ontem, e nenhuma das duas diria nada sozinha.
 *
 * A tela da Evolução mostra o par — primeira e mais recente de um ângulo —
 * porque é a pergunta que ela responde. Aqui a pergunta é outra, é o
 * caminho inteiro.
 */
export default async function FotosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dias = await buscarFotosPorDia(supabase, user.id);
  const total = dias.reduce((soma, d) => soma + d.fotos.length, 0);

  return (
    <div className="flex grow flex-col gap-8 px-5 pb-10 pt-6">
      <Link
        href="/saude/evolucao"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={14} desfoque={4} className="flex flex-col gap-2 px-1">
        <h1 className="text-[26px] leading-tight text-texto">Suas fotos</h1>
        <p className="text-[16.5px] leading-[1.6] text-auxiliar">
          {total === 0
            ? "Nenhuma ainda."
            : `${total} ${total === 1 ? "foto" : "fotos"}, em ${dias.length} ${
                dias.length === 1 ? "dia" : "dias"
              }.`}
        </p>
      </Revelar>

      <div className="flex flex-col gap-8">
        {dias.map((dia, indice) => (
          <Revelar
            key={dia.data}
            imediato={indice < 2}
            atraso={60 + indice * 50}
          >
            <DiaDeFotos dia={dia} />
          </Revelar>
        ))}
      </div>
    </div>
  );
}
