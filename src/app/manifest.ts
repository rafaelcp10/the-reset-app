import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Reset",
    short_name: "The Reset",
    description: "Ritual diário.",
    start_url: "/",
    display: "standalone",
    background_color: "#101114",
    theme_color: "#101114",
    icons: [],
  };
}
