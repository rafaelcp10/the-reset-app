import Link from "next/link";
import { Check } from "lucide-react";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import { marcarCompromissoDia } from "@/lib/ritual/acoes";

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
    <section className="flex flex-col gap-3.5 py-3.5">
      <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
        Inegociáveis
      </h2>

      {temSlotVazio && (
        <p className="text-[13.5px] leading-[1.6] text-auxiliar">
          Os três inegociáveis são definidos na{" "}
          <Link href="/ritual/domingo" className="underline underline-offset-4">
            revisão de domingo
          </Link>
          . Ficam iguais a semana toda.
        </p>
      )}

      <div className="flex flex-col">
        {definidos.map((slot) => (
          <LinhaInegociavel
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

function LinhaInegociavel({
  slot,
  dataHoje,
  caminhoAtual,
}: {
  slot: InegociavelSlot;
  dataHoje: string;
  caminhoAtual: string;
}) {
  const { compromisso, feitoHoje } = slot;
  if (!compromisso) return null;
  const marcado = feitoHoje === true;

  return (
    <form
      action={marcarCompromissoDia.bind(
        null,
        caminhoAtual,
        compromisso.id,
        dataHoje,
        !marcado,
      )}
    >
      <button
        type="submit"
        aria-label={`${compromisso.texto} — ${marcado ? "feito hoje" : "não marcado"}`}
        className="flex min-h-12 w-full items-center gap-3 text-left"
      >
        <span
          className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-[220ms] ${
            marcado ? "border-acento bg-acento-escuro" : "border-filete-forte"
          }`}
        >
          {marcado && (
            <Check
              className="entrada-check h-3.5 w-3.5 text-texto"
              strokeWidth={2}
            />
          )}
        </span>
        <span className="text-[16.5px] leading-[1.5] text-texto">
          {compromisso.texto}
        </span>
      </button>
    </form>
  );
}
