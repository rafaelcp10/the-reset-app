import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/supabase/auth";
import { buscarFrasesAtuais, garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { FRASES_PADRAO } from "@/lib/frases/modelo";
import IdentidadeForm from "./IdentidadeForm";

export default async function IdentidadePage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) redirect("/login");

  // A garantia mora aqui também, e não só no layout: a conta nasce neste
  // passo (ver proxy.ts), e o layout do onboarding não roda de novo quando
  // se chega pelo "Começar" da abertura — ele foi desenhado lá, ainda sem
  // sessão. Sem isto, a linha de `usuarios` não existia, e a frase salva
  // aqui batia na chave estrangeira.
  await garantirUsuarioEFrasesPadrao(supabase, user);
  const frases = await buscarFrasesAtuais(supabase, user.id);
  const atual = frases.identidade;

  return (
    <IdentidadeForm
      textoBase={atual?.texto ?? FRASES_PADRAO.identidade.texto}
      valorInicial={atual?.preenchimento_lacuna ?? ""}
    />
  );
}
