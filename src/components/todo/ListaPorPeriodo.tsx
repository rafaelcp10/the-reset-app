import { agruparPorPeriodo, type TarefaItem } from "@/lib/todo/dados";
import LinhaTarefa from "./LinhaTarefa";

/**
 * A lista separada por período do dia.
 *
 * O rótulo aparece só quando há mais de um grupo em jogo: com tudo sem
 * hora — o estado de quem nunca escolheu — um cabeçalho solitário seria a
 * tela falando de si mesma em vez de mostrar o dia.
 */
export default function ListaPorPeriodo({
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
  const grupos = agruparPorPeriodo(itens);
  const mostrarRotulos = grupos.length > 1;

  return (
    <div className="flex flex-col gap-5">
      {grupos.map((grupo) => (
        <div key={grupo.rotulo} className="flex flex-col gap-2">
          {mostrarRotulos && (
            <h3 className="tipo-rotulo px-1 text-[12.5px] tracking-[.22em] text-auxiliar-fraco">
              {grupo.rotulo}
            </h3>
          )}
          <div className="bloco flex flex-col px-4">
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
