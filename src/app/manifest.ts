import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrushSVG - Fast & Accurate SVG to PNG Converter",
    short_name: "CrushSVG",
    description: "Convert SVG to PNG exactly as intended. Fast, accurate rendering for icons, illustrations, and logos.",
    id: "/?source=pwa",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    dir: "ltr",
    lang: "en",
    orientation: "any",
    background_color: "#FFFFFF",
    theme_color: "#D94A1E",
    categories: ["photo", "productivity", "utilities", "graphics"],
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
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "SVG to PNG Converter",
        short_name: "SVG to PNG",
        description: "Fast and high-fidelity SVG to PNG conversion",
        url: "/convert-svg-to-png",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "PNG to SVG Vectorizer",
        short_name: "PNG to SVG",
        description: "Vectorize PNG and raster images to SVG paths",
        url: "/png-to-svg",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Background Remover",
        short_name: "BG Remover",
        description: "Remove background from images instantly in browser",
        url: "/background-remover",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Image Resizer",
        short_name: "Resizer",
        description: "Resize and optimize images with precision",
        url: "/image-resizer",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
