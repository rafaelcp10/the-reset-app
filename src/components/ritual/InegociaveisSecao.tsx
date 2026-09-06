import { Check, X } from "lucide-react";
import type { InegociavelSlot } from "@/lib/ritual/dados";
import { marcarCompromissoDia, salvarCompromissoSlot } from "@/lib/ritual/acoes";

export default function InegociaveisSecao({
  inegociaveis,
  semanaInicio,
  dataHoje,
  caminhoAtual,
}: {
  inegociaveis: InegociavelSlot[];
  semanaInicio: string;
  dataHoje: string;
  caminhoAtual: string;
}) {
  const temSlotVazio = inegociaveis.some((slot) => !slot.compromisso);

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-auxiliar">
          Inegociáveis
        </h2>
        {temSlotVazio && (
          <p className="text-xs text-auxiliar/70">
            Só cabem 3 por semana — o que realmente importa.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {inegociaveis.map((slot) => (
          <LinhaInegociavel
            key={slot.ordem}
            slot={slot}
            semanaInicio={semanaInicio}
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
  semanaInicio,
  dataHoje,
  caminhoAtual,
}: {
  slot: InegociavelSlot;
  semanaInicio: string;
  dataHoje: string;
  caminhoAtual: string;
}) {
  if (!slot.compromisso) {
    return (
      <form
        action={salvarCompromissoSlot.bind(
          null,
          caminhoAtual,
          semanaInicio,
          slot.ordem,
        )}
        className="flex items-center gap-3 rounded-2xl bg-texto/5 px-4 py-3"
      >
        <input
          type="text"
          name="texto"
          required
          placeholder={`Inegociável ${slot.ordem + 1} da semana`}
          className="min-w-0 flex-1 bg-transparent text-texto outline-none placeholder:text-auxiliar/60"
        />
        <button type="submit" className="shrink-0 text-sm font-medium text-texto">
          salvar
        </button>
      </form>
    );
  }

  const { compromisso, feitoHoje } = slot;
  const proximoFeito = feitoHoje !== true;
  const rotulo =
    feitoHoje === true
      ? "feito hoje"
      : feitoHoje === false
        ? "não feito hoje"
        : "ainda não marcado hoje";

  return (
    <form
      action={marcarCompromissoDia.bind(
        null,
        caminhoAtual,
        compromisso.id,
        dataHoje,
        proximoFeito,
      )}
    >
      <button
        type="submit"
        aria-label={`${compromisso.texto} — ${rotulo}`}
        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ${
          feitoHoje === true ? "bg-texto/10" : "bg-texto/5"
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            feitoHoje === null ? "border-auxiliar/40" : "border-texto/60"
          }`}
        >
          {feitoHoje === true && (
            <Check className="h-4 w-4 text-texto" strokeWidth={2} />
          )}
          {feitoHoje === false && (
            <X className="h-4 w-4 text-auxiliar" strokeWidth={2} />
          )}
        </span>
        <span
          className={feitoHoje === false ? "flex-1 text-auxiliar" : "flex-1 text-texto"}
        >
          {compromisso.texto}
        </span>
      </button>
    </form>
  );
}
