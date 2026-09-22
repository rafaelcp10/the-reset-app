"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ROTAS_ONBOARDING, passoMacroDe } from "@/lib/onboarding/passos";

export default function ProgressoOnboarding() {
  const pathname = usePathname();
  const indice = ROTAS_ONBOARDING.indexOf(
    pathname as (typeof ROTAS_ONBOARDING)[number],
  );
  const anterior = indice > 0 ? ROTAS_ONBOARDING[indice - 1] : null;
  const passoMacro = passoMacroDe(pathname);

  return (
    <div className="flex items-center justify-between px-6 pt-6">
      {anterior ? (
        <Link
          href={anterior}
          aria-label="Voltar"
          className="-m-3 inline-flex p-3 text-auxiliar"
        >
          <ChevronLeft className="h-6 w-6" strokeWidth={1.5} />
        </Link>
      ) : (
        <div className="h-6 w-6" />
      )}
      <span className="tipo-rotulo text-[14.5px] tracking-[.1em] text-auxiliar">
        {passoMacro ? `Passo ${passoMacro} de 5` : ""}
      </span>
    </div>
  );
}
