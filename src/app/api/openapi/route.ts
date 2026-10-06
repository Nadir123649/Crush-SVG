import { NextRequest, NextResponse } from "next/server";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "@/lib/openapi/registry";
import { getApiOrigin } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const spec = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "CrushSVG API",
      version: "1.0.0",
      description:
        "SVG to PNG conversion, raster to SVG vectorization, and account management API.",
      contact: { name: "CrushSVG", url: "https://www.crushsvg.net" },
    },
    servers: [
      { url: getApiOrigin(request), description: "API" },
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
