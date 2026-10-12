import "server-only";
import { convertBuffer, type Options as VtracerOptions } from "@visioncortex/vtracer";
import type { ImageClass, RasterOptions, RasterQuality } from "./types";
import { RasterConversionError } from "./errors";

interface QualityKnobs {
  pathPrecision: number;
  simplify: number;
  filterSpeckle: number;
  colorPrecision: number;
  spliceThreshold: number;
  cornerThreshold: number;
}

const QUALITY_KNOBS: Record<RasterQuality, QualityKnobs> = {
  draft: { pathPrecision: 5, simplify: 1, filterSpeckle: 4, colorPrecision: 7, spliceThreshold: 2, cornerThreshold: 45 },
  standard: { pathPrecision: 8, simplify: 0, filterSpeckle: 1, colorPrecision: 9, spliceThreshold: 1, cornerThreshold: 60 },
  max: { pathPrecision: 8, simplify: 0, filterSpeckle: 0, colorPrecision: 11, spliceThreshold: 0, cornerThreshold: 60 },
};

const COLOR_DEFAULTS: Record<RasterQuality, number> = { draft: 16, standard: 32, max: 64 };
const PHOTO_COLORS: Record<RasterQuality, number> = { draft: 24, standard: 48, max: 64 };

export function buildVtracerOptions(
  imageClass: ImageClass,
  options: RasterOptions,
  hasAlpha: boolean,
): VtracerOptions {
  const q = QUALITY_KNOBS[options.quality];

  if (imageClass === "mono" || imageClass === "line-art") {
    return {
      preset: "bw",
      clustering: "bw",
      mode: "spline",
      adaptive: true,
      filterSpeckle: q.filterSpeckle,
      pathPrecision: q.pathPrecision,
      cornerThreshold: q.cornerThreshold,
      optimize: 2,
    };
  }

  if (imageClass === "photo") {
    const maxColors = options.colorCount ?? PHOTO_COLORS[options.quality];
    return {
      preset: "photo",
      mode: "spline",
      clustering: "color-cluster",
      maxColors,
      filterSpeckle: q.filterSpeckle,
      colorPrecision: q.colorPrecision,
      pathPrecision: q.pathPrecision,
      cornerThreshold: q.cornerThreshold,
      optimize: 2,
    };
  }

// color-logo / graphic artwork (clean shapes, text, sharp corners, smooth curves)
  const maxColors = options.colorCount ?? COLOR_DEFAULTS[options.quality];
  return {
    preset: "poster",
    mode: "spline",
    clustering: "color-cluster",
    hierarchical: hasAlpha ? "cutout" : "stacked",
    maxColors,
    filterSpeckle: q.filterSpeckle,
    colorPrecision: q.colorPrecision,
    pathPrecision: 8,
    cornerThreshold: 60,
    optimize: 2,
  };
}

export function traceRaster(png: Buffer, options: VtracerOptions): string {
  try {
    return convertBuffer(new Uint8Array(png), options);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new RasterConversionError("vectorization_failed", `Tracing failed: ${msg}`);
  }
}

/** Best-effort count of distinct fill colors in the produced SVG. */
export function countSvgColors(svg: string): number {
  const fills = svg.match(/fill="(#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]*\))"/g) ?? [];
  return new Set(fills).size;
}
