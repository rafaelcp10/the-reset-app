"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const PREFIXOS_SEM_NAV = ["/login", "/auth", "/onboarding", "/ritual/espelho"];

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const semNav = PREFIXOS_SEM_NAV.some((prefixo) => pathname.startsWith(prefixo));

  if (semNav) {
    return <div className="acima flex grow flex-col">{children}</div>;
  }

  return (
    <>
      {/* Coluna flex para que as telas curtas consigam ocupar a altura
          disponível em vez de empilhar no topo e deixar um vão morto. */}
      <main className="acima flex grow flex-col pb-24">{children}</main>
      <BottomNav />
    </>
  );
}
