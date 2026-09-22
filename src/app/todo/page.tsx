import { redirect } from "next/navigation";
import { CalendarDays, CalendarRange, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoTodo } from "@/lib/todo/dados";
import BlocoInegociaveis from "@/components/todo/BlocoInegociaveis";
import ListaPorPeriodo from "@/components/todo/ListaPorPeriodo";
import CampoAdicionar from "@/components/todo/CampoAdicionar";
import Painel, { Barra } from "@/components/saude/Painel";
import Revelar from "@/components/movimento/Revelar";

const CAMINHO = "/todo";

export default async function TodoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await garantirUsuarioEFrasesPadrao(supabase, user);
  const estado = await buscarEstadoTodo(supabase, user.id);

  const feitasHoje = estado.hoje.filter((i) => i.feito).length;
  const faltamHoje = estado.hoje.length - feitasHoje;

  return (
    <div className="flex grow flex-col gap-5 px-5 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4} className="mb-1 px-1">
        <p className="tipo-rotulo text-[13.5px] tracking-[.1em] text-auxiliar">
          {estado.dataExtenso} · semana {estado.numeroSemana}
        </p>
      </Revelar>

      <Revelar imediato atraso={80}>
        <BlocoInegociaveis
          inegociaveis={estado.inegociaveis}
          dataHoje={estado.dataHoje}
          caminhoAtual={CAMINHO}
        />
      </Revelar>

      <Revelar imediato atraso={160}>
        <Painel icone={Sun} rotulo="Hoje">
          {estado.hoje.length === 0 ? (
            <p className="text-[16px] leading-[1.6] text-auxiliar">
              Nada marcado para hoje.
            </p>
          ) : (
            <>
              {/* O que falta, e não o que foi feito: a lista existe para
                  mostrar o que ainda está de pé. Zerada, ela diz zero, que
                  é a única comemoração que cabe aqui. */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-[34px] leading-none tabular-nums text-texto">
                  {faltamHoje}
                </span>
                <span className="text-[16px] text-auxiliar">
                  {faltamHoje === 1 ? "restante" : "restantes"}
                  {feitasHoje > 0 && ` · ${feitasHoje} de ${estado.hoje.length}`}
                </span>
              </div>

              {/* A barra é cinza: o âmbar desta tela pertence à marcação. */}
              <Barra feito={feitasHoje} total={estado.hoje.length} />

              <ListaPorPeriodo
                itens={estado.hoje}
                dataHoje={estado.dataHoje}
                caminhoAtual={CAMINHO}
              />
            </>
          )}

          {/* Escrever a tarefa nova fica dentro do painel dela, e não no
              rodapé da tela: o campo estava depois de tudo, longe da lista
              em que a tarefa ia aparecer. */}
          <div className="border-t border-filete pt-3">
            <CampoAdicionar caminhoAtual={CAMINHO} />
          </div>
        </Painel>
      </Revelar>

      <Revelar atraso={40}>
        <Painel icone={CalendarRange} rotulo="Esta semana">
          {estado.semana.length === 0 ? (
            <p className="text-[16px] leading-[1.6] text-auxiliar">
              Nada esperando.
            </p>
          ) : (
            <ListaPorPeriodo
              itens={estado.semana}
              dataHoje={estado.dataHoje}
              caminhoAtual={CAMINHO}
              podePuxar
            />
          )}
        </Painel>
      </Revelar>

      {/* A grade do mês era um ícone de 22px no canto do cabeçalho. Virou
          painel porque é uma tela inteira, e porque ícone sozinho no topo
          não diz para onde leva. */}
      <Revelar atraso={80}>
        <Painel icone={CalendarDays} rotulo="O mês" href="/todo/grade">
          <p className="text-[16px] leading-[1.5] text-auxiliar">
            Os dias de trás, e o que ficou marcado em cada um.
          </p>
        </Painel>
      </Revelar>

    </div>
  );
}
