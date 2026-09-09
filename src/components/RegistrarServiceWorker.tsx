"use client";

import { useEffect } from "react";
import { registrarServiceWorker } from "@/lib/push/cliente";

/**
 * Registra o service worker uma vez, em qualquer tela. É ele que guarda o
 * casco do app para abrir offline — não depende de a pessoa ter ligado o
 * check-in noturno.
 */
export default function RegistrarServiceWorker() {
  useEffect(() => {
    registrarServiceWorker();
  }, []);

  return null;
}
