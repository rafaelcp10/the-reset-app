import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarEvolucao, type Medida } from "@/lib/saude/evolucao";
import CampoMedidas, { type Referencia } from "../CampoMedidas";
import Revelar from "@/components/movimento/Revelar";

const CAMPOS = ["peso_kg", "pescoco_cm", "cintura_cm", "quadril_cm"] as const;

/**
 * O registro mais próximo do mesmo campo, em outra data — a régua da
 * confirmação de número fora do comum.
 *
 * O anterior, quando existe: é com ele que um peso novo se compara. Sem
 * anterior (corrigindo a primeira medida), vale o seguinte.
 */
function referenciaPara(
  campo: (typeof CAMPOS)[number],
  data: string,
  medidas: Medida[],
): Referencia | null {
  const outras = medidas.filter((m) => m.data !== data && m[campo] !== null);
  const antes = outras
    .filter((m) => m.data < data)
    .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
  if (antes) return { valor: Number(antes[campo]), data: antes.data, quando: "antes" };
  const depois = outras
    .filter((m) => m.data > data)
    .sort((a, b) => (a.data < b.data ? -1 : 1))[0];
  if (depois) return { valor: Number(depois[campo]), data: depois.data, quando: "depois" };
  return null;
}

function porExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(ano, mes - 1, dia, 12)));
}

/**
 * A tela de medir — de hoje, ou de um dia que já tem medida.
 *
 * Saiu do topo da Evolução porque aquela aba se abre para conferir, não
 * para preencher: passar a fita é coisa de uma vez por semana, e o
 * resultado é coisa de todo dia. Deixar o formulário na frente fazia a
 * tela pedir antes de mostrar.
 *
 * Tela própria, e não bloco que abre no lugar: com o teclado do celular
 * aberto sobra meia tela, e nela cabe só o que está sendo digitado.
 *
 * **Com `?data=`, corrige uma medida antiga** — é para onde leva o
 * "Corrigir" embaixo das curvas da Evolução. Só abre datas que já têm
 * medida: corrigir é sobre o que existe, e uma data qualquer na URL não
 * pode virar registro novo no passado.
 */
export default async function MedidaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: pedida }, evo] = await Promise.all([
    searchParams,
    buscarEvolucao(supabase, user.id),
  ]);

  const antiga =
    pedida && pedida !== evo.hoje
      ? evo.medidas.find((m) => m.data === pedida)
      : undefined;
  const data = antiga ? antiga.data : evo.hoje;
  const doDia = evo.medidas.find((m) => m.data === data);

  const referencias = Object.fromEntries(
    CAMPOS.map((c) => [c, referenciaPara(c, data, evo.medidas)]),
  );

  return (
    <div className="flex grow flex-col gap-6 px-5 pb-10 pt-6">
      <Link
        href="/saude/evolucao"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
      </Link>

      <Revelar imediato y={14} desfoque={4} className="flex flex-col gap-2 px-1">
        <h1 className="text-[26px] leading-tight text-texto">
          {antiga
            ? `A medida de ${porExtenso(data)}`
            : doDia
              ? "A medida de hoje"
              : "Nova medida"}
        </h1>
        <p className="text-[16.5px] leading-[1.6] text-auxiliar">
          {antiga
            ? "Digitar de novo corrige. Apagar o número tira esse valor."
            : doDia
              ? "Já tem registro de hoje. Digitar de novo corrige."
              : "Salva ao sair de cada campo. Dá para preencher só o peso."}
        </p>
      </Revelar>

      <Revelar imediato atraso={80}>
        <CampoMedidas
          data={data}
          sexo={evo.sexo}
          altura={evo.alturaPerfil}
          valores={{
            peso_kg: doDia?.peso_kg ?? null,
            pescoco_cm: doDia?.pescoco_cm ?? null,
            cintura_cm: doDia?.cintura_cm ?? null,
            quadril_cm: doDia?.quadril_cm ?? null,
          }}
          referencias={referencias}
        />
      </Revelar>

      <Revelar atraso={40}>
        <Link
          href="/saude/evolucao"
          className="botao-acento tipo-rotulo block w-full rounded-[12px] py-4 text-center text-[16px] tracking-[.09em] text-fundo"
        >
          Pronto
        </Link>
      </Revelar>
    </div>
  );
}
