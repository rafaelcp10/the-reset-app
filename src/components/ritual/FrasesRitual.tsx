import {
  FUNCOES,
  FRASES_PADRAO,
  ROTULOS_FUNCAO,
  textoCompleto,
  type Funcao,
  type FraseRow,
} from "@/lib/frases/modelo";
import { salvarEdicaoFrase } from "@/lib/frases/acoes";
import FraseRitualLinha from "./FraseRitualLinha";
import FraseAutoSalvar from "@/components/frases/FraseAutoSalvar";
import FraseIdentidadeRitual from "@/components/frases/FraseIdentidadeRitual";

const BotaoOuvir = () => (
  <button type="button" disabled className="text-auxiliar/40">
    ouvir (em breve)
  </button>
);

export default function FrasesRitual({
  frases,
  recolhidas,
  caminhoAtual,
}: {
  frases: Record<Funcao, FraseRow>;
  recolhidas: boolean;
  caminhoAtual: string;
}) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-auxiliar">
        As cinco frases
      </h2>

      <div className="flex flex-col gap-5">
        {FUNCOES.map((funcao) => {
          const frase = frases[funcao];
          const texto = frase
            ? textoCompleto(frase)
            : FRASES_PADRAO[funcao].texto;

          return (
            <FraseRitualLinha
              key={funcao}
              rotulo={ROTULOS_FUNCAO[funcao]}
              previewTexto={texto}
              recolhidaInicialmente={recolhidas}
            >
              {funcao === "identidade" ? (
                <FraseIdentidadeRitual
                  textoBase={frase?.texto ?? FRASES_PADRAO.identidade.texto}
                  preenchimento={frase?.preenchimento_lacuna ?? ""}
                  caminhoAtual={caminhoAtual}
                />
              ) : (
                <FraseAutoSalvar
                  textoAtual={texto}
                  textoPadrao={FRASES_PADRAO[funcao].texto}
                  acaoSalvar={salvarEdicaoFrase.bind(null, funcao, caminhoAtual)}
                  extraAcoes={<BotaoOuvir />}
                />
              )}
            </FraseRitualLinha>
          );
        })}
      </div>
    </section>
  );
}
