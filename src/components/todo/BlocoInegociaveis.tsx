import Link from "next/link";
import { Anchor } from "lucide-react";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import LinhaInegociavel from "@/components/ritual/LinhaInegociavel";
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
                variante="todo"
                key={slot.ordem}
                slot={slot}
                dataHoje={dataHoje}
                caminhoAtual={caminhoAtual}
              />
            ))}
          </div>

          <Link
            href="/ritual/domingo"
            className="text-[15.5px] text-auxiliar underline underline-offset-4"
          >
            editar no ritual de domingo
          </Link>
        </>
      )}
    </Painel>
  );
}
