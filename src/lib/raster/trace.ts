import "server-only";
import { convertBuffer, type Options as VtracerOptions } from "@visioncortex/vtracer";
import type { ImageClass, RasterOptions, RasterQuality } from "./types";
import { RasterConversionError } from "./errors";

interface QualityKnobs {
  pathPrecision: number;
  simplify: number;
  filterSpeckle: number;
  colorPrecision: number;
  layerDifference: number;
  lengthThreshold: number;
  maxIterations: number;
  spliceThreshold: number;
  cornerThreshold: number;
}

const QUALITY_KNOBS: Record<RasterQuality, QualityKnobs> = {
  draft: { pathPrecision: 5, simplify: 1, filterSpeckle: 4, colorPrecision: 7, layerDifference: 24, lengthThreshold: 6, maxIterations: 6, spliceThreshold: 2, cornerThreshold: 45 },
  standard: { pathPrecision: 8, simplify: 0, filterSpeckle: 1, colorPrecision: 9, layerDifference: 16, lengthThreshold: 4, maxIterations: 10, spliceThreshold: 1, cornerThreshold: 60 },
  max: { pathPrecision: 8, simplify: 0, filterSpeckle: 0, colorPrecision: 11, layerDifference: 10, lengthThreshold: 2.5, maxIterations: 15, spliceThreshold: 0, cornerThreshold: 60 },
};

// VTracer 1.0.0-alpha.4 collapses multi-color artwork at precision 9+.
const MAX_SAFE_COLOR_PRECISION = 6;
function safeColorPrecision(value: number): number {
  return Math.min(value, MAX_SAFE_COLOR_PRECISION);
}

const COLOR_DEFAULTS: Record<RasterQuality, number> = { draft: 16, standard: 32, max: 64 };
const PHOTO_COLORS: Record<RasterQuality, number> = { draft: 32, standard: 64, max: 96 };

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
      maxIterations: q.maxIterations,
      optimize: 2,
    };
  }

  if (imageClass === "photo") {
    const maxColors = options.colorCount ?? PHOTO_COLORS[options.quality];
    return {
      preset: "photo",
      mode: "spline",
      clustering: "color-cluster",
      hierarchical: hasAlpha ? "cutout" : "stacked",
      maxColors,
      filterSpeckle: q.filterSpeckle,
      colorPrecision: safeColorPrecision(q.colorPrecision),
      pathPrecision: q.pathPrecision,
      layerDifference: q.layerDifference,
      lengthThreshold: q.lengthThreshold,
      cornerThreshold: q.cornerThreshold,
      maxIterations: q.maxIterations,
      spliceThreshold: q.spliceThreshold,
      simplify: q.simplify,
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
    colorPrecision: safeColorPrecision(q.colorPrecision),
    pathPrecision: q.pathPrecision,
    layerDifference: q.layerDifference,
    lengthThreshold: q.lengthThreshold,
    cornerThreshold: q.cornerThreshold,
    maxIterations: q.maxIterations,
    spliceThreshold: q.spliceThreshold,
    simplify: q.simplify,
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
