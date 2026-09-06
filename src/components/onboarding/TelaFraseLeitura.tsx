import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarFrasesAtuais } from "@/lib/frases/dados";
import { FRASES_PADRAO, type Funcao } from "@/lib/frases/modelo";
import FraseLeituraEditavel from "@/components/frases/FraseLeituraEditavel";
import { salvarEdicaoFrase } from "@/lib/frases/acoes";

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

  return (
    <div className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16">
      <FraseLeituraEditavel
        textoAtual={texto}
        textoPadrao={FRASES_PADRAO[funcao].texto}
        acaoSalvar={salvarEdicaoFrase.bind(null, funcao, caminhoAtual)}
      />
      <Link
        href={proximaRota}
        className="w-full rounded-full bg-acento py-3 text-center font-interface font-medium text-fundo"
      >
        Continuar
      </Link>
    </div>
  );
}
