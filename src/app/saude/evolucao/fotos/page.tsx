import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarTodasAsFotos } from "@/lib/saude/fotos";
import Revelar from "@/components/movimento/Revelar";
import ItemFoto from "./ItemFoto";

/**
 * As fotos antigas, da mais nova para a mais antiga.
 *
 * Uma por linha, grande. A tela da Evolução mostra o par — primeira e mais
 * recente — porque é a pergunta que ela responde; aqui a pergunta é outra,
 * é o caminho inteiro, e miniatura em grade não deixa ver caminho nenhum.
 */
export default async function FotosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fotos = await buscarTodasAsFotos(supabase, user.id);

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
          {fotos.length === 0
            ? "Nenhuma ainda."
            : `${fotos.length} ${fotos.length === 1 ? "foto" : "fotos"}, da mais nova para a mais antiga.`}
        </p>
      </Revelar>

      <div className="flex flex-col gap-6">
        {fotos.map((foto, indice) => (
          <Revelar key={foto.id} imediato={indice < 2} atraso={60 + indice * 40}>
            <ItemFoto foto={foto} />
          </Revelar>
        ))}
      </div>
    </div>
  );
}
