import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tecumseh Golf",
    short_name: "Tecumseh Golf",
    description: "Pro shop, heated range, fitting & repairs — shop online, pick up in store.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe3",
    theme_color: "#0d3b24",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
