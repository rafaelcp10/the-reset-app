"use client";

import { fecharSemana } from "@/lib/domingo/acoes";

export default function FecharSemanaForm({
  semanaPassadaInicio,
  comoEstouAtual,
}: {
  semanaPassadaInicio: string;
  comoEstouAtual: string | null;
}) {
  return (
    <form
      action={fecharSemana.bind(null, semanaPassadaInicio)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <h2 className="text-[21px] text-texto">Como eu estou hoje</h2>
        <textarea
          name="comoEstou"
          defaultValue={comoEstouAtual ?? ""}
          placeholder="do jeito que der. ninguém vai ler."
          rows={4}
          className="resize-none border-b border-filete-media bg-transparent px-2 py-1.5 text-[16px] leading-[1.6] text-texto outline-none placeholder:text-auxiliar-fraco focus:border-acento focus:bg-acento-escuro"
        />
      </div>

      <button
        type="submit"
        className="tipo-rotulo w-full rounded-[6px] bg-acento py-3 text-center text-[16px] tracking-[.09em] text-fundo"
      >
        Fechar a semana
      </button>
    </form>
  );
}
