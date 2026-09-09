/*
 * Service worker do The Reset.
 *
 * Faz duas coisas:
 *   1. Recebe o push do check-in noturno e mostra a notificação, com os
 *      dois botões que resolvem o dia sem abrir o app.
 *   2. Guarda o casco do app para ele abrir offline.
 *
 * O conteúdo é pessoal (ver CLAUDE.md), então nada de resposta de página
 * vai para o cache — só arquivos estáticos e a tela de offline.
 */

const CACHE = "the-reset-v1";
const CASCO = ["/offline", "/manifest.webmanifest"];

/*
 * Em desenvolvimento os nomes dos arquivos do Next são estáveis, então
 * guardar estático em cache faz o navegador servir código velho depois de
 * cada edição — silenciosamente, o que é pior que quebrar. Em produção os
 * nomes têm hash e o problema não existe.
 */
const EM_DESENVOLVIMENTO =
  self.location.hostname === "localhost" ||
  self.location.hostname === "127.0.0.1";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(CASCO)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Estático do Next: imutável em produção, então cache primeiro.
  if (!EM_DESENVOLVIMENTO && url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(
      caches.match(request).then(
        (guardado) =>
          guardado ||
          fetch(request).then((resposta) => {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
            return resposta;
          }),
      ),
    );
    return;
  }

  // Navegação: sempre rede primeiro — o conteúdo é do dia e é pessoal.
  // Sem rede, mostra a tela de offline em vez do erro do navegador.
  if (request.mode === "navigate") {
    evento.respondWith(
      fetch(request).catch(() => caches.match("/offline")),
    );
  }
});

self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = {};
  }

  const titulo = dados.titulo || "The Reset";
  const opcoes = {
    body: dados.corpo || "Hora de fechar o dia.",
    tag: dados.tag || "checkin",
    renotify: false,
    icon: "/icone-192.png",
    badge: "/icone-192.png",
    data: { url: dados.url || "/ritual", data: dados.data || null },
    actions: dados.comAcoes
      ? [
          { action: "fiz", title: "Fiz" },
          { action: "naofiz", title: "Não fiz" },
        ]
      : [],
  };

  evento.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (evento) => {
  const { action, notification } = evento;
  notification.close();

  const destino = notification.data?.url || "/ritual";
  const dia = notification.data?.data;

  // Fiz / Não fiz resolvem o check-in sem abrir o app — é a promessa de
  // "menos de 5 segundos" cumprida de verdade.
  if (action === "fiz" || action === "naofiz") {
    evento.waitUntil(
      fetch("/api/push/acao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feito: action === "fiz", data: dia }),
        credentials: "include",
      }).catch(() => {}),
    );
    return;
  }

  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if ("focus" in janela) return janela.focus();
      }
      return self.clients.openWindow(destino);
    }),
  );
});
