import { agruparPorPeriodo, type TarefaItem } from "@/lib/todo/dados";
import LinhaTarefa from "./LinhaTarefa";

/**
 * A lista separada por período do dia, dentro de um painel.
 *
 * Cada período é um sub-bloco, uma superfície acima do painel — a mesma
 * gramática de elevação da Saúde, um nível abaixo. Antes cada grupo era um
 * `.bloco` solto na coluna, e a tela virava uma pilha de blocos sem dono.
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
    <div className="flex flex-col gap-3">
      {grupos.map((grupo) => (
        <div key={grupo.rotulo} className="flex flex-col gap-1.5">
          {mostrarRotulos && (
            <h3 className="tipo-rotulo px-1 text-[12.5px] tracking-[.22em] text-auxiliar-fraco">
              {grupo.rotulo}
            </h3>
          )}
          <div className="flex flex-col rounded-[10px] bg-superficie3 px-3 py-1">
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
