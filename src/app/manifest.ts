import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Reset",
    short_name: "The Reset",
    description: "Ritual diário.",
    // A Home, e não o ritual.
    //
    // O app instalado abre por aqui toda vez que é aberto do zero, e a
    // Home é o painel de controle: ritual, semana, tarefas, treino, água
    // e peso. Abrir direto no espelho pulava tudo isso — inclusive a água,
    // que é o que se toca mais vezes por dia.
    start_url: "/",
    display: "standalone",
    background_color: "#101114",
    theme_color: "#101114",
    lang: "pt-BR",
    icons: [
      { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icone-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
