import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { garantirUsuarioEFrasesPadrao } from "@/lib/frases/dados";
import { buscarEstadoTodo } from "@/lib/todo/dados";
import BlocoInegociaveis from "@/components/todo/BlocoInegociaveis";
import LinhaTarefa from "@/components/todo/LinhaTarefa";
import CampoAdicionar from "@/components/todo/CampoAdicionar";
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

  return (
    <div className="flex grow flex-col gap-14 px-6 pb-10 pt-8">
      <Revelar imediato y={14} desfoque={4}>
        <div className="flex items-start justify-between gap-3">
          <p className="tipo-rotulo text-[9.5px] tracking-[.18em] text-auxiliar">
            {estado.dataExtenso} · semana {estado.numeroSemana}
          </p>
          <Link
            href="/todo/grade"
            aria-label="Abrir a grade do mês"
            className="-m-3 inline-flex shrink-0 p-3 text-auxiliar"
          >
            <CalendarDays className="h-[17px] w-[17px]" strokeWidth={1.5} />
          </Link>
        </div>
      </Revelar>

      <Revelar imediato atraso={80}>
        <BlocoInegociaveis
          inegociaveis={estado.inegociaveis}
          dataHoje={estado.dataHoje}
          caminhoAtual={CAMINHO}
        />
      </Revelar>

      <Revelar imediato atraso={160} className="flex flex-col gap-4">
        {/* O âmbar desta tela pertence à marcação, não ao título. */}
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Hoje
        </h2>
        {estado.hoje.length === 0 ? (
          <p className="text-[15px] leading-[1.6] text-auxiliar">
            Nada marcado para hoje.
          </p>
        ) : (
          <div className="flex flex-col">
            {estado.hoje.map((item) => (
              <LinhaTarefa
                key={item.tarefa.id}
                item={item}
                dataHoje={estado.dataHoje}
                caminhoAtual={CAMINHO}
              />
            ))}
          </div>
        )}
      </Revelar>

      <Revelar atraso={40} className="flex flex-col gap-4">
        <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
          Esta semana
        </h2>
        {estado.semana.length === 0 ? (
          <p className="text-[15px] leading-[1.6] text-auxiliar">
            Nada esperando.
          </p>
        ) : (
          <div className="flex flex-col">
            {estado.semana.map((item) => (
              <LinhaTarefa
                key={item.tarefa.id}
                item={item}
                dataHoje={estado.dataHoje}
                caminhoAtual={CAMINHO}
                podePuxar
              />
            ))}
          </div>
        )}
      </Revelar>

      <Revelar atraso={80}>
        <CampoAdicionar caminhoAtual={CAMINHO} />
      </Revelar>
    </div>
  );
}
