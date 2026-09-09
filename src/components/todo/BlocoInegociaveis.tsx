import Link from "next/link";
import { Check } from "lucide-react";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import { marcarCompromissoDia } from "@/lib/ritual/acoes";

/**
 * Os inegociáveis não são item de lista: são quem a pessoa está virando.
 * Por isso texto maior, alvo de toque maior e um vão generoso separando
 * do resto da tela — nunca um filete.
 *
 * Aqui só se marca. Definir e editar é no Ritual de domingo.
 */
export default function BlocoInegociaveis({
  inegociaveis,
  dataHoje,
  caminhoAtual,
}: {
  inegociaveis: InegociavelSlot[];
  dataHoje: string;
  caminhoAtual: string;
}) {
  const definidos = inegociaveis.filter((slot) => slot.compromisso);

  return (
    <section className="flex flex-col gap-5">
      <h2 className="tipo-rotulo text-[14px] tracking-[.18em] text-texto">
        Inegociáveis da semana
      </h2>

      {definidos.length === 0 ? (
        <p className="text-[15px] leading-[1.6] text-auxiliar">
          Você ainda não definiu os três.{" "}
          <Link
            href="/ritual/domingo"
            className="text-texto underline underline-offset-4"
          >
            Definir no ritual de domingo
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            {definidos.map((slot) => (
              <LinhaInegociavel
                key={slot.ordem}
                slot={slot}
                dataHoje={dataHoje}
                caminhoAtual={caminhoAtual}
              />
            ))}
          </div>

          <Link
            href="/ritual/domingo"
            className="text-[13px] text-auxiliar underline underline-offset-4"
          >
            editar no ritual de domingo
          </Link>
        </>
      )}
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
        className="flex min-h-14 w-full items-center gap-4 text-left"
      >
        <span
          className={`flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-[250ms] ${
            marcado ? "border-acento bg-acento-escuro" : "border-filete-forte"
          }`}
        >
          {marcado && (
            <Check
              className="entrada-check h-4 w-4 text-texto"
              strokeWidth={2}
            />
          )}
        </span>
        <span
          className={`font-frase text-[18px] leading-[1.5] ${
            marcado ? "text-auxiliar" : "text-texto"
          }`}
        >
          {compromisso.texto}
        </span>
      </button>
    </form>
  );
}
