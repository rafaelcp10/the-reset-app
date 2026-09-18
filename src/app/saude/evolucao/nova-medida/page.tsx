import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarEvolucao } from "@/lib/saude/evolucao";
import CampoMedidas from "../CampoMedidas";
import Revelar from "@/components/movimento/Revelar";

/**
 * A tela de medir.
 *
 * Saiu do topo da Evolução porque aquela aba se abre para conferir, não
 * para preencher: passar a fita é coisa de uma vez por semana, e o
 * resultado é coisa de todo dia. Deixar o formulário na frente fazia a
 * tela pedir antes de mostrar.
 *
 * Tela própria, e não bloco que abre no lugar: com o teclado do celular
 * aberto sobra meia tela, e nela cabe só o que está sendo digitado.
 */
export default async function MedidaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const evo = await buscarEvolucao(supabase, user.id);
  const deHoje = evo.medidas.find((m) => m.data === evo.hoje);

  return (
    <div className="flex grow flex-col gap-6 px-5 pb-10 pt-6">
      <Link
        href="/saude/evolucao"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={14} desfoque={4} className="flex flex-col gap-2 px-1">
        <h1 className="text-[26px] leading-tight text-texto">
          {deHoje ? "A medida de hoje" : "Nova medida"}
        </h1>
        <p className="text-[16.5px] leading-[1.6] text-auxiliar">
          {deHoje
            ? "Já tem registro de hoje. Digitar de novo corrige."
            : "Salva ao sair de cada campo. Dá para preencher só o peso."}
        </p>
      </Revelar>

      <Revelar imediato atraso={80}>
        <CampoMedidas
          data={evo.hoje}
          sexo={evo.sexo}
          altura={evo.alturaPerfil}
          valores={{
            peso_kg: deHoje?.peso_kg ?? null,
            pescoco_cm: deHoje?.pescoco_cm ?? null,
            cintura_cm: deHoje?.cintura_cm ?? null,
            quadril_cm: deHoje?.quadril_cm ?? null,
          }}
        />
      </Revelar>

      <Revelar atraso={40}>
        <Link
          href="/saude/evolucao"
          className="botao-acento tipo-rotulo block w-full rounded-[12px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Pronto
        </Link>
      </Revelar>
    </div>
  );
}
