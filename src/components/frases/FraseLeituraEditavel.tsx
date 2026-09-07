"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil } from "lucide-react";
import type { EstadoEdicaoFrase } from "@/lib/frases/acoes";

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

export default function FraseLeituraEditavel({
  textoAtual,
  textoPadrao,
  acaoSalvar,
  extraAcoes,
}: {
  textoAtual: string;
  textoPadrao: string;
  acaoSalvar: (
    estado: EstadoEdicaoFrase,
    formData: FormData,
  ) => Promise<EstadoEdicaoFrase>;
  extraAcoes?: ReactNode;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(textoAtual);
  const [estado, formAction] = useActionState(acaoSalvar, ESTADO_INICIAL);

  // Fecha o modo de edição quando a ação de salvar conclui — ajuste de
  // estado durante o render (não em efeito) para evitar um re-render extra.
  const [ultimoSalvoEm, setUltimoSalvoEm] = useState(estado.salvoEm);
  if (estado.salvoEm !== ultimoSalvoEm) {
    setUltimoSalvoEm(estado.salvoEm);
    if (estado.salvoEm) setEditando(false);
  }

  if (!editando) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-frase text-2xl leading-relaxed text-texto">{textoAtual}</p>
        <div className="flex items-center gap-5 text-sm">
          <button
            type="button"
            onClick={() => {
              setValor(textoAtual);
              setEditando(true);
            }}
            className="tipo-rotulo flex items-center gap-1.5 text-[10px] tracking-[.16em] text-auxiliar"
          >
            <Pencil className="h-[13px] w-[13px]" strokeWidth={1.5} />
            Editar
          </button>
          {extraAcoes}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <textarea
        name="texto"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        rows={4}
        autoFocus
        spellCheck={false}
        className="resize-none bg-transparent font-frase text-2xl leading-relaxed text-texto outline-none"
      />
      {estado.erro && <p className="text-sm text-auxiliar">{estado.erro}</p>}
      <div className="flex items-center gap-5 text-sm">
        <button
          type="button"
          onClick={() => setValor(textoPadrao)}
          className="text-auxiliar underline underline-offset-4"
        >
          restaurar padrão
        </button>
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
