import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { usuarioDaSessao } from "@/lib/supabase/auth";
import { buscarFotosPorDia } from "@/lib/saude/fotos";
import Revelar from "@/components/movimento/Revelar";
import DiaDeFotos from "./DiaDeFotos";

/**
 * As fotos antigas, do dia mais novo para o mais antigo.
 *
 * O dia é a unidade porque é assim que a sessão acontece: quatro ângulos de
 * uma vez. Uma lista corrida misturaria as costas de hoje com a frente de
 * ontem, e nenhuma das duas diria nada sozinha.
 *
 * A tela da Evolução mostra o par — primeira e mais recente de um ângulo —
 * porque é a pergunta que ela responde. Aqui a pergunta é outra, é o
 * caminho inteiro.
 */
export default async function FotosPage() {
  const supabase = await createClient();
  const user = await usuarioDaSessao(supabase);
  if (!user) redirect("/login");

  const dias = await buscarFotosPorDia(supabase, user.id);
  const total = dias.reduce((soma, d) => soma + d.fotos.length, 0);

  return (
    <div className="flex grow flex-col gap-8 px-5 pb-10 pt-6">
      <Link
        href="/saude/evolucao"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={14} desfoque={4} className="flex flex-col gap-2 px-1">
        <h1 className="text-[26px] leading-tight text-texto">Suas fotos</h1>
        <p className="text-[16.5px] leading-[1.6] text-auxiliar">
          {resumo(total, dias.map((d) => d.data))}
        </p>
      </Revelar>

      <div className="flex flex-col gap-8">
        {dias.map((dia, indice) => (
          <Revelar
            key={dia.data}
            imediato={indice < 2}
            atraso={60 + indice * 50}
          >
            <DiaDeFotos dia={dia} />
          </Revelar>
        ))}
      </div>
    </div>
  );
}

/** "21 de setembro", e com o ano quando as duas pontas não são do mesmo ano. */
function quando(iso: string, comAno: boolean): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    ...(comAno ? { year: "numeric" } : {}),
  }).format(new Date(Date.UTC(ano, mes - 1, dia, 12)));
}

/**
 * "8 fotos em 2 sessões, de 21 de setembro a 21 de outubro."
 *
 * Era "8 fotos, em 2 dias", que queria dizer duas sessões e se lia como
 * "ao longo de dois dias" — para quem fotografou com um mês de intervalo,
 * parecia errado. A pergunta de quem abre a galeria é "desde quando", e o
 * intervalo responde; "sessão" é o nome do que acontece num dia de fotos.
 *
 * `datas` vem do mais novo para o mais antigo, como a galeria.
 */
function resumo(total: number, datas: string[]): string {
  if (total === 0) return "Nenhuma ainda.";
  const fotos = `${total} ${total === 1 ? "foto" : "fotos"}`;
  const maisNova = datas[0];
  const maisAntiga = datas[datas.length - 1];
  if (datas.length === 1) return `${fotos}, em ${quando(maisNova, true)}.`;
  const comAno = maisNova.slice(0, 4) !== maisAntiga.slice(0, 4);
  return `${fotos} em ${datas.length} sessões, de ${quando(maisAntiga, comAno)} a ${quando(maisNova, comAno)}.`;
}
