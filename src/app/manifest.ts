import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrushSVG - Fast & Accurate SVG to PNG Converter",
    short_name: "CrushSVG",
    description: "Convert SVG to PNG exactly as intended. Fast, accurate rendering for icons, illustrations, and logos.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#D94A1E",
    icons: [
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
