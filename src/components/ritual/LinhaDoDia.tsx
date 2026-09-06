import { confirmarDia, salvarLinhaHoje } from "@/lib/ritual/acoes";

export default function LinhaDoDia({
  modo,
  linhaHoje,
  linhaOntem,
  feitoHoje,
  dataHoje,
  caminhoAtual,
}: {
  modo: "manha" | "noite";
  linhaHoje: string | null;
  linhaOntem: string | null;
  feitoHoje: boolean | null;
  dataHoje: string;
  caminhoAtual: string;
}) {
  if (modo === "manha") {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-auxiliar">
          A linha de hoje
        </h2>

        <form
          action={salvarLinhaHoje.bind(null, caminhoAtual, dataHoje)}
          className="flex flex-col gap-2"
        >
          <textarea
            name="linha"
            defaultValue={linhaHoje ?? ""}
            placeholder="O que você vai fazer hoje?"
            rows={2}
            className="resize-none rounded-2xl bg-texto/5 px-4 py-3 text-texto outline-none placeholder:text-auxiliar/60"
          />
          <button
            type="submit"
            className="self-end text-sm font-medium text-texto"
          >
            salvar
          </button>
        </form>

        {linhaOntem && (
          <p className="text-sm text-auxiliar">Ontem: {linhaOntem}</p>
        )}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-interface text-sm font-medium uppercase tracking-wide text-auxiliar">
        A linha de hoje
      </h2>

      <p className="truncate text-base text-texto">
        {linhaHoje || (
          <span className="text-auxiliar">Você não escreveu nada hoje.</span>
        )}
      </p>

      <div className="flex gap-3">
        <form
          action={confirmarDia.bind(null, caminhoAtual, dataHoje, true)}
          className="flex-1"
        >
          <button
            type="submit"
            className={`w-full rounded-2xl py-3 text-center font-medium ${
              feitoHoje === true
                ? "bg-texto text-fundo"
                : "bg-texto/5 text-texto"
            }`}
          >
            Fiz
          </button>
        </form>
        <form
          action={confirmarDia.bind(null, caminhoAtual, dataHoje, false)}
          className="flex-1"
        >
          <button
            type="submit"
            className={`w-full rounded-2xl py-3 text-center font-medium ${
              feitoHoje === false
                ? "bg-texto/10 text-texto"
                : "bg-texto/5 text-auxiliar"
            }`}
          >
            Não fiz
          </button>
        </form>
      </div>
    </section>
  );
}
