"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";

const PREFIXOS_SEM_NAV = ["/login", "/auth", "/onboarding", "/ritual/espelho"];

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const semNav = PREFIXOS_SEM_NAV.some((prefixo) => pathname.startsWith(prefixo));

  if (semNav) {
    return <>{children}</>;
  }

  return (
    <>
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </>
  );
}
