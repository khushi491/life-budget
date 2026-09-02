import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LifeBudget",
    short_name: "LifeBudget",
    description:
      "A guided personal finance journey: after this lifestyle, can you afford the next life decision?",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "browser"],
    background_color: "#F6EFBE",
    theme_color: "#F6EFBE",
    lang: "en",
    categories: ["finance", "lifestyle"],
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512-maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Home",
        short_name: "Home",
        url: "/dashboard",
      },
      {
        name: "Budget",
        short_name: "Budget",
        url: "/budget",
      },
      {
        name: "Goals",
        short_name: "Goals",
        url: "/goals",
      },
    ],
  };
}
