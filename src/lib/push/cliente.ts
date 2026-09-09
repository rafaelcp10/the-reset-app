"use client";

import { salvarInscricaoPush, removerInscricaoPush } from "./acoes";

/** A chave VAPID viaja em base64url; o navegador quer bytes. */
function chaveParaBytes(base64url: string): ArrayBuffer {
  const preenchimento = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(base64);
  const buffer = new ArrayBuffer(bruto.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bruto.length; i += 1) bytes[i] = bruto.charCodeAt(i);
  return buffer;
}

export function pushDisponivel(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}

export type ResultadoPush = "ativado" | "negado" | "indisponivel" | "erro";

export async function ativarPush(chavePublica: string): Promise<ResultadoPush> {
  if (!pushDisponivel() || !chavePublica) return "indisponivel";

  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return "negado";

  try {
    const registro =
      (await navigator.serviceWorker.getRegistration()) ??
      (await registrarServiceWorker());
    if (!registro) return "erro";

    await navigator.serviceWorker.ready;

    const existente = await registro.pushManager.getSubscription();
    const inscricao =
      existente ??
      (await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: chaveParaBytes(chavePublica),
      }));

    const bruta = inscricao.toJSON();
    if (!bruta.endpoint || !bruta.keys?.p256dh || !bruta.keys?.auth) return "erro";

    await salvarInscricaoPush({
      endpoint: bruta.endpoint,
      chaves: { p256dh: bruta.keys.p256dh, auth: bruta.keys.auth },
    });
    return "ativado";
  } catch {
    return "erro";
  }
}

export async function desativarPush() {
  if (!pushDisponivel()) return;
  try {
    const registro = await navigator.serviceWorker.getRegistration();
    const inscricao = await registro?.pushManager.getSubscription();
    if (!inscricao) return;
    const endpoint = inscricao.endpoint;
    await inscricao.unsubscribe();
    await removerInscricaoPush(endpoint);
  } catch {
    // Sem inscrição ativa não há o que desfazer.
  }
}
