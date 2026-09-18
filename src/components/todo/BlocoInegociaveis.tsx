import Link from "next/link";
import { Anchor, Check } from "lucide-react";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import { marcarCompromissoDia } from "@/lib/ritual/acoes";
import Painel from "@/components/saude/Painel";

/**
 * Os inegociáveis não são item de lista: são quem a pessoa está virando.
 * Por isso texto maior e alvo de toque maior — a frase segue na fonte das
 * frases, e não na da interface, mesmo dentro de um painel.
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
    <Painel icone={Anchor} rotulo="Inegociáveis da semana">
      {definidos.length === 0 ? (
        <p className="text-[16px] leading-[1.6] text-auxiliar">
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
          <div className="flex flex-col rounded-[10px] bg-superficie3 px-3 py-1">
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
            className="text-[14.5px] text-auxiliar underline underline-offset-4"
          >
            editar no ritual de domingo
          </Link>
        </>
      )}
    </Painel>
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
              className="entrada-check h-5 w-5 text-texto"
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
