import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buscarEstadoHome } from "@/lib/home/dados";
import Revelar from "@/components/movimento/Revelar";

export default async function SemanasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const estado = await buscarEstadoHome(supabase, user.id);
  const semanas = [...estado.faixaSemanas].reverse();

  return (
    <div className="flex grow flex-col gap-8 px-6 pb-10 pt-6">
      <Link
        href="/ritual"
        aria-label="Voltar"
        className="-m-3 inline-flex self-start p-3 text-auxiliar"
      >
        <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
      </Link>

      {/* Poucas semanas ocupam pouco espaço: em vez de deixar o número
          solto no topo com um vão embaixo, o bloco assenta no centro. */}
      <div className="flex grow flex-col justify-center gap-8">
        <Revelar imediato y={18} className="flex flex-col gap-2">
          <p
            className="text-[78px] font-bold leading-[.84] text-acento"
            style={{
              fontStretch: "66%",
              textShadow: "0 0 60px rgb(201 123 58 / 0.4)",
            }}
          >
            {estado.semanasCumpridas}
          </p>
          <p className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
            semanas cumpridas
          </p>
          <p className="text-[13.5px] leading-[1.6] text-auxiliar">
            Uma semana conta quando você abriu e respondeu. Não precisa ter sido
            uma boa semana.
          </p>
        </Revelar>

        <div className="flex flex-col gap-4">
          {semanas.map((semana, i) => (
            <Revelar
              key={semana.semanaInicio}
              imediato={i < 6}
              atraso={140 + Math.min(i, 8) * 70}
              y={14}
              desfoque={4}
            >
              <div className="flex flex-col gap-4">
                {i > 0 && <div className="fio-luz" />}
                <p className="text-[14.5px] text-texto">
                  <span className="tipo-rotulo tracking-[.1em] text-auxiliar">
                    Semana {String(semana.numero).padStart(2, "0")}
                  </span>{" "}
                  · {semana.diasRespondidos} de 7 dias respondidos
                </p>
              </div>
            </Revelar>
          ))}
        </div>
      </div>
    </div>
  );
}
