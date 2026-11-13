import type { MetadataRoute } from "next";

import { TAGLINE } from "@/lib/copy";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pro Resume Tailor",
    short_name: "Resume Tailor",
    description: TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#f3f1ea",
    theme_color: "#12241c",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
