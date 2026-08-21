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
        src: "/CrushSVG-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
