import "server-only";
import type { ImageClass, RasterOptions } from "./types";

const CLASS_LABEL: Record<ImageClass, string> = {
  mono: "monochrome artwork",
  "line-art": "line art",
  "color-logo": "color logo / icon",
  photo: "photograph",
};

interface MetadataContext {
  width: number;
  height: number;
  imageClass: ImageClass;
  options: RasterOptions;
}

/** Inject accessibility (title/desc) and CrushSVG provenance metadata. */
export function injectMetadata(svg: string, ctx: MetadataContext): string {
  const label = CLASS_LABEL[ctx.imageClass];
  const title = `CrushSVG vectorized ${label}`;
  const desc = `Raster-to-SVG conversion (${ctx.width}x${ctx.height}, mode ${ctx.options.mode}, quality ${ctx.options.quality}).`;
  const metadata = [
    `<title>${escapeXml(title)}</title>`,
    `<desc>${escapeXml(desc)}</desc>`,
    `<metadata>`,
    `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`,
    `<crushsvg:Conversion xmlns:crushsvg="https://www.crushsvg.net/ns#">`,
    `<crushsvg:engine>vtracer</crushsvg:engine>`,
    `<crushsvg:mode>${escapeXml(ctx.options.mode)}</crushsvg:mode>`,
    `<crushsvg:quality>${escapeXml(ctx.options.quality)}</crushsvg:quality>`,
    `<crushsvg:imageClass>${escapeXml(ctx.imageClass)}</crushsvg:imageClass>`,
    `</crushsvg:Conversion>`,
    `</rdf:RDF>`,
    `</metadata>`,
  ].join("");

  const open = svg.match(/<svg\b[^>]*>/i)?.[0];
  if (!open) return svg;

  let contentToInsert = metadata;
  let workingSvg = svg;

  if (ctx.options.background === "transparent") {
    // Strip full-canvas background rect if present
    workingSvg = workingSvg.replace(
      /<rect[^>]*(?:width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["']|height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'])[^>]*\/>\s*/gi,
      ""
    );
  } else if (ctx.options.background === "custom" && ctx.options.bgColor) {
    workingSvg = workingSvg.replace(
      /<rect[^>]*(?:width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["']|height\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'][^>]*width\s*=\s*["'](?:100%|[0-9]+\.?[0-9]*)["'])[^>]*\/>\s*/gi,
      ""
    );
    contentToInsert += `<rect width="${ctx.width}" height="${ctx.height}" fill="${escapeXml(ctx.options.bgColor)}"/>`;
  }

  const freshOpen = workingSvg.match(/<svg\b[^>]*>/i)?.[0];
  if (!freshOpen) return workingSvg;
  const insertAt = workingSvg.indexOf(freshOpen) + freshOpen.length;
  return workingSvg.slice(0, insertAt) + contentToInsert + workingSvg.slice(insertAt);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
