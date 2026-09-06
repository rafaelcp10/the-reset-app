"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sunrise, ListChecks, Target, Dumbbell } from "lucide-react";
import type { ComponentType } from "react";

type Tab = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
};

const TABS: Tab[] = [
  { label: "Home", href: "/", icon: Home, active: true },
  { label: "Ritual", href: "/ritual", icon: Sunrise, active: true },
  { label: "To-do", href: "/todo", icon: ListChecks, active: false },
  { label: "Objetivos", href: "/objetivos", icon: Target, active: false },
  { label: "Academia", href: "/academia", icon: Dumbbell, active: false },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 bg-fundo pb-[env(safe-area-inset-bottom)]">
      <ul className="flex items-stretch justify-between px-2 pt-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isCurrent = tab.active && pathname === tab.href;

          if (!tab.active) {
            return (
              <li key={tab.href} className="flex-1">
                <div
                  aria-disabled="true"
                  className="flex select-none flex-col items-center gap-1 py-2 text-auxiliar/40"
                >
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                  <span className="text-[11px] font-interface">
                    {tab.label}
                  </span>
                </div>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-1 py-2 font-interface ${
                  isCurrent ? "text-texto" : "text-auxiliar"
                }`}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} />
                <span className="text-[11px]">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
