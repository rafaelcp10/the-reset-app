import { agruparPorPeso, ROTULO_PESO, type TarefaItem } from "@/lib/todo/dados";
import LinhaTarefa from "./LinhaTarefa";

/**
 * A lista separada por faixa de peso.
 *
 * O rótulo da faixa só aparece quando há mais de uma em jogo: com tudo em
 * "Depois" — que é o estado de quem nunca mexeu nisso — três cabeçalhos
 * seriam três títulos para uma lista só, e a tela ficaria falando de si
 * mesma em vez de mostrar o dia.
 */
export default function ListaPorPeso({
  itens,
  dataHoje,
  caminhoAtual,
  podePuxar = false,
}: {
  itens: TarefaItem[];
  dataHoje: string;
  caminhoAtual: string;
  podePuxar?: boolean;
}) {
  const grupos = agruparPorPeso(itens);
  const mostrarRotulos = grupos.length > 1;

  return (
    <div className="flex flex-col gap-6">
      {grupos.map((grupo) => (
        <div key={grupo.peso} className="flex flex-col gap-2">
          {mostrarRotulos && (
            <h3 className="tipo-rotulo text-[9.5px] tracking-[.22em] text-auxiliar-fraco">
              {ROTULO_PESO[grupo.peso]}
            </h3>
          )}
          <div
            className={`flex flex-col ${
              // "Se sobrar" não é castigo: recua um pouco e segue legível.
              grupo.peso === "se_sobrar" ? "opacity-70" : ""
            }`}
          >
            {grupo.itens.map((item) => (
              <LinhaTarefa
                key={item.tarefa.id}
                item={item}
                dataHoje={dataHoje}
                caminhoAtual={caminhoAtual}
                podePuxar={podePuxar}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
