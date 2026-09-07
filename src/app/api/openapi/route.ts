import { NextResponse } from "next/server";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "@/lib/openapi/registry";

export const runtime = "nodejs";

export async function GET() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const spec = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "CrushSVG API",
      version: "1.0.0",
      description:
        "SVG to PNG conversion, raster to SVG vectorization, and account management API.",
      contact: { name: "CrushSVG", url: "https://crushsvg.net" },
    },
    servers: [
      { url: "https://crushsvg.net", description: "Production" },
      { url: "http://localhost:3000", description: "Development" },
    ],
    security: [],
  });

  return NextResponse.json(spec, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
