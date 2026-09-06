"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PASSOS_ONBOARDING } from "@/lib/onboarding/passos";

export default function ProgressoOnboarding() {
  const pathname = usePathname();
  const indice = PASSOS_ONBOARDING.indexOf(
    pathname as (typeof PASSOS_ONBOARDING)[number],
  );
  const anterior = indice > 0 ? PASSOS_ONBOARDING[indice - 1] : null;

  return (
    <div className="flex items-center gap-4 px-6 pt-6">
      {anterior ? (
        <Link href={anterior} aria-label="Voltar" className="text-auxiliar">
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      ) : (
        <div className="h-5 w-5" />
      )}
      <div className="flex flex-1 gap-1.5">
        {PASSOS_ONBOARDING.map((passo, i) => (
          <div
            key={passo}
            className={`h-1 flex-1 rounded-full ${
              i <= indice ? "bg-texto" : "bg-auxiliar/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
