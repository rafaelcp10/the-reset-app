import Link from "next/link";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import LinhaInegociavel from "@/components/ritual/LinhaInegociavel";

export default function InegociaveisSecao({
  inegociaveis,
  dataHoje,
  caminhoAtual,
}: {
  inegociaveis: InegociavelSlot[];
  dataHoje: string;
  caminhoAtual: string;
}) {
  const temSlotVazio = inegociaveis.some((slot) => !slot.compromisso);
  const definidos = inegociaveis.filter((slot) => slot.compromisso);

  return (
    <section className="flex flex-col gap-3.5">
      <h2 className="tipo-rotulo px-1 text-[16px] tracking-[.1em] text-texto">
        Inegociáveis
      </h2>

      {temSlotVazio && (
        <p className="px-1 text-[16px] leading-[1.6] text-auxiliar">
          Os três inegociáveis são definidos na{" "}
          <Link href="/ritual/domingo" className="underline underline-offset-4">
            revisão de domingo
          </Link>
          . Ficam iguais a semana toda.
        </p>
      )}

      <div className={definidos.length > 0 ? "bloco flex flex-col px-4" : "hidden"}>
        {definidos.map((slot) => (
          <LinhaInegociavel
            variante="ritual"
            key={slot.ordem}
            slot={slot}
            dataHoje={dataHoje}
            caminhoAtual={caminhoAtual}
          />
        ))}
      </div>
    </section>
  );
}
