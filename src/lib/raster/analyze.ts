import "server-only";
import sharp from "sharp";
import type { ImageClass, RasterMode } from "./types";

export interface ImageAnalysis {
  imageClass: ImageClass;
  transparentRatio: number;
  hasAlpha: boolean;
  isGrayscale: boolean;
  /** Distinct quantized colors / sampled pixels (0..1). */
  uniqueColorRatio: number;
  /** Fraction of sampled pixels that are edges (0..1). */
  edgeDensity: number;
}

/**
 * Cheap, deterministic feature extractor used to resolve `mode: "auto"` and to
 * decide whether a photo-style input needs an advisory. Samples pixels (with a
 * stride) so it stays bounded on large rasters.
 */
export async function analyzeImage(png: Buffer, hasAlpha: boolean): Promise<ImageAnalysis> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const count = width * height;
  const stride = Math.max(1, Math.floor(Math.sqrt(count / 200_000))); // ~200k samples cap
  const hasA = channels === 4;

  let transparent = 0;
  let graySum = 0;
  let edge = 0;
  const palette = new Set<number>();
  const sampleW = Math.ceil(width / stride);
  const at = (x: number, y: number) => (y * width + x) * channels;

  let sampled = 0;
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const i = at(x, y);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = hasA ? data[i + 3] : 255;
      if (a < 24) transparent++;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      graySum += (max - min) / 255;
      palette.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
      // edge test against right/down neighbor
      if (x + stride < width) {
        const j = at(x + stride, y);
        if (Math.abs(r - data[j]) + Math.abs(g - data[j + 1]) + Math.abs(b - data[j + 2]) > 48) edge++;
      }
      sampled++;
    }
  }
  if (sampled === 0) sampled = 1;

  const transparentRatio = transparent / sampled;
  const isGrayscale = graySum / sampled < 0.08;
  const uniqueColorRatio = Math.min(1, palette.size / sampled);
  const edgeDensity = edge / sampled;

  return {
    imageClass: classify(isGrayscale, uniqueColorRatio, edgeDensity, transparentRatio),
    transparentRatio,
    hasAlpha: hasAlpha || transparentRatio > 0.001,
    isGrayscale,
    uniqueColorRatio,
    edgeDensity,
  };
}

function classify(
  isGrayscale: boolean,
  uniqueColorRatio: number,
  edgeDensity: number,
  transparentRatio: number,
): ImageClass {
  const detailed = edgeDensity > 0.12 || uniqueColorRatio > 0.25;
  if (isGrayscale) {
    if (detailed) return edgeDensity > 0.18 ? "line-art" : "mono";
    return "mono";
  }
  if (transparentRatio > 0.02 && !detailed) return "color-logo";
  if (detailed) return "photo";
  return "color-logo";
}

/** Resolve the effective engine class from the user mode + analysis. */
export function resolveImageClass(mode: RasterMode, analysis: ImageAnalysis): ImageClass {
  switch (mode) {
    case "logo":
      return "color-logo";
    case "line-art":
      return analysis.isGrayscale ? "line-art" : "color-logo";
    case "photo":
      return "photo";
    case "auto":
    default:
      return analysis.imageClass;
  }
}
