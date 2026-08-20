export const dynamic = "force-static";
import type { MetadataRoute } from "next";


export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CrushSVG - SVG to PNG Converter",
    short_name: "CrushSVG",
    description: "Convert SVG files and code to crisp PNG images instantly.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCFA",
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
