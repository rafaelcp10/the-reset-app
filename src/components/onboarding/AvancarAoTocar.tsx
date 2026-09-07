"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export default function AvancarAoTocar({
  proximaRota,
  children,
}: {
  proximaRota: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <div
      className="flex flex-1 flex-col justify-between px-6 pb-10 pt-10"
      onClick={() => router.push(proximaRota)}
    >
      {children}
    </div>
  );
}
