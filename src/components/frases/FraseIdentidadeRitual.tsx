"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { dividirNaLacuna } from "@/lib/frases/modelo";
import { salvarLacuna, type EstadoEdicaoFrase } from "@/lib/frases/acoes";

const ESTADO_INICIAL: EstadoEdicaoFrase = {};

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="ml-auto text-sm font-medium text-texto disabled:opacity-40"
    >
      {pending ? "salvando..." : "salvar"}
    </button>
  );
}

export default function FraseIdentidadeRitual({
  textoBase,
  preenchimento,
  caminhoAtual,
}: {
  textoBase: string;
  preenchimento: string;
  caminhoAtual: string;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(preenchimento);
  const [estado, formAction] = useActionState(
    salvarLacuna.bind(null, caminhoAtual),
    ESTADO_INICIAL,
  );

  const [ultimoSalvoEm, setUltimoSalvoEm] = useState(estado.salvoEm);
  if (estado.salvoEm !== ultimoSalvoEm) {
    setUltimoSalvoEm(estado.salvoEm);
    if (estado.salvoEm) setEditando(false);
  }

  const [antes, depois] = dividirNaLacuna(textoBase);

  if (!editando) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-frase text-2xl leading-relaxed">
          {antes}
          {preenchimento}
          {depois}
        </p>
        <div className="flex items-center gap-5 text-sm">
          <button
            type="button"
            onClick={() => {
              setValor(preenchimento);
              setEditando(true);
            }}
            className="text-auxiliar underline underline-offset-4"
          >
            editar
          </button>
          <button type="button" disabled className="text-auxiliar/40">
            ouvir (em breve)
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="font-frase text-2xl leading-relaxed">
        {antes}
        <input
          type="text"
          name="preenchimento"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoFocus
          className="mx-1 w-40 border-b-2 border-texto bg-transparent text-center text-texto outline-none"
        />
        {depois}
      </p>
      {estado.erro && <p className="text-sm text-auxiliar">{estado.erro}</p>}
      <div className="flex items-center gap-5 text-sm">
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="text-auxiliar"
        >
          cancelar
        </button>
        <BotaoSalvar />
      </div>
    </form>
  );
}
