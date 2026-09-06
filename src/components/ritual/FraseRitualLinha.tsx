"use client";

import { useState, type ReactNode } from "react";

export default function FraseRitualLinha({
  rotulo,
  previewTexto,
  recolhidaInicialmente,
  children,
}: {
  rotulo: string;
  previewTexto: string;
  recolhidaInicialmente: boolean;
  children: ReactNode;
}) {
  const [expandida, setExpandida] = useState(!recolhidaInicialmente);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setExpandida((v) => !v)}
        className="flex items-baseline gap-3 text-left"
      >
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-auxiliar">
          {rotulo}
        </span>
        {!expandida && (
          <span className="truncate text-sm text-auxiliar">{previewTexto}</span>
        )}
      </button>
      {expandida && children}
    </div>
  );
}
