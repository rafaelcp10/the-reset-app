import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarEstadoRevisao } from "@/lib/domingo/dados";
import { FUNCOES, FRASES_PADRAO, ROTULOS_FUNCAO } from "@/lib/frases/modelo";
import { salvarEdicaoFrase } from "@/lib/frases/acoes";
import FraseLeituraEditavel from "@/components/frases/FraseLeituraEditavel";
import FraseIdentidadeRitual from "@/components/frases/FraseIdentidadeRitual";
import CampoInegociavelDomingo from "./CampoInegociavelDomingo";
import FecharSemanaForm from "./FecharSemanaForm";

const CAMINHO = "/ritual/domingo";

export default async function RevisaoDomingoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const estado = await buscarEstadoRevisao(supabase, user.id);

  return (
    <div className="flex grow flex-col gap-10 px-6 pb-10 pt-6">
      <Link
        href="/ritual"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <section className="flex flex-col gap-4">
        <h1 className="text-[21px] text-texto">O que aconteceu na semana</h1>
        <div className="flex flex-col gap-3">
          {estado.dias.map((dia) => (
            <div key={dia.data} className="flex items-baseline gap-3">
              <span className="tipo-rotulo w-8 shrink-0 text-[14px] tracking-[.1em] text-auxiliar">
                {dia.diaAbrev}
              </span>
              <span className="flex-1 text-[16px] text-texto">
                {dia.linha || "—"}
              </span>
              {dia.feito !== null && (
                <span className="shrink-0 text-[15.5px] text-auxiliar-fraco">
                  {dia.feito ? "fiz" : "não fiz"}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="tipo-rotulo text-[16px] tracking-[.1em] text-texto">
          Inegociáveis da semana que vem
        </h2>
        <div className="flex flex-col gap-4">
          {estado.inegociaveisAtuais.map((compromisso, ordem) => (
            <CampoInegociavelDomingo
              key={ordem}
              ordem={ordem}
              semanaAtualInicio={estado.semanaAtualInicio}
              valorAtual={compromisso?.texto ?? null}
              caminhoAtual={CAMINHO}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="tipo-rotulo text-[16px] tracking-[.1em] text-texto">
          As cinco frases
        </h2>
        {FUNCOES.map((funcao) => {
          const frase = estado.frases[funcao];
          return (
            <div key={funcao} className="flex flex-col gap-2">
              <span className="tipo-rotulo text-[13.5px] tracking-[.12em] text-auxiliar">
                {ROTULOS_FUNCAO[funcao]}
              </span>
              {funcao === "identidade" ? (
                <FraseIdentidadeRitual
                  textoBase={frase?.texto ?? FRASES_PADRAO.identidade.texto}
                  preenchimento={frase?.preenchimento_lacuna ?? ""}
                  caminhoAtual={CAMINHO}
                  tamanho="ritual"
                />
              ) : (
                <FraseLeituraEditavel
                  textoAtual={frase?.texto ?? FRASES_PADRAO[funcao].texto}
                  textoPadrao={FRASES_PADRAO[funcao].texto}
                  acaoSalvar={salvarEdicaoFrase.bind(null, funcao, CAMINHO)}
                />
              )}
            </div>
          );
        })}
      </section>

      <FecharSemanaForm
        semanaPassadaInicio={estado.semanaPassadaInicio}
        comoEstouAtual={estado.comoEstouAtual}
      />
    </div>
  );
}
