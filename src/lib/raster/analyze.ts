import "server-only";
import sharp from "sharp";
import type { ImageClass, ImageSignals, RasterMode } from "./types";

/**
 * Legacy analysis interface retained for backward compatibility with
 * raster-to-svg.ts. New code should use computeSignals() and ImageSignals.
 */
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

// ---------------------------------------------------------------------------
// Core: signal-based analysis
// ---------------------------------------------------------------------------

/**
 * Cheap, deterministic feature extractor. Samples pixels (stride-based) so it
 * stays bounded on large rasters. Returns composable signals — no image is
 * forced into a single mutually-exclusive class.
 *
 * The single decode via sharp.raw() provides all pixel data; no re-encoding
 * is performed.
 */
export async function computeSignals(png: Buffer): Promise<ImageSignals> {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const pixelCount = width * height;

  // Stride-based sampling: cap at ~200k sampled pixels
  const stride = Math.max(1, Math.floor(Math.sqrt(pixelCount / 200_000)));
  const hasAlpha = channels === 4;

  // Accumulators
  let sampled = 0;
  let transparent = 0;
  let graySum = 0;
  let edgeCount = 0;
  const palette = new Set<number>();

  const bytesPerPixel = channels;
  const rowStride = width * bytesPerPixel;

  for (let y = 0; y < height; y += stride) {
    const rowOffset = y * rowStride;
    for (let x = 0; x < width; x += stride) {
      const i = rowOffset + x * bytesPerPixel;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = hasAlpha ? data[i + 3] : 255;

      // Transparency: count pixels with meaningful transparency (alpha < 200)
      // This avoids flagging near-opaque anti-aliased fringes as transparent.
      if (a < 200) transparent++;

      // Grayness: max channel spread normalised to 0..1.
      // A pixel is "gray" when its RGB channels are close together.
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      graySum += (max - min) / 255;

      // Color bucketing: 5 bits per channel → 32768 buckets (vs old 4096).
      palette.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));

      // Edge detection: check RIGHT and DOWN neighbours (not just right).
      // Uses Manhattan distance across RGB channels; threshold 48 chosen to
      // match the legacy sensitivity.
      const EDGE_THRESHOLD = 48;
      let isEdge = false;

      if (x + stride < width) {
        const j = rowOffset + (x + stride) * bytesPerPixel;
        const dr = Math.abs(r - data[j]);
        const dg = Math.abs(g - data[j + 1]);
        const db = Math.abs(b - data[j + 2]);
        if (dr + dg + db > EDGE_THRESHOLD) isEdge = true;
      }
      if (!isEdge && y + stride < height) {
        const j = (y + stride) * rowStride + x * bytesPerPixel;
        const dr = Math.abs(r - data[j]);
        const dg = Math.abs(g - data[j + 1]);
        const db = Math.abs(b - data[j + 2]);
        if (dr + dg + db > EDGE_THRESHOLD) isEdge = true;
      }
      if (isEdge) edgeCount++;

      sampled++;
    }
  }

  if (sampled === 0) sampled = 1;

  const grayness = graySum / sampled;
  const paletteSize = palette.size;
  const edgeDensity = edgeCount / sampled;
  const transparencyRatio = transparent / sampled;

  return {
    grayness,
    paletteSize,
    edgeDensity,
    transparencyRatio,
    hasAlpha: hasAlpha || transparencyRatio > 0.001,
    isLowComplexity: paletteSize < 12 && edgeDensity < 0.08,
    isHighComplexity: paletteSize > 100 || edgeDensity > 0.20,
    isGrayscale: grayness > 0.92,
    hasTransparency: transparencyRatio > 0.005,
  };
}

// ---------------------------------------------------------------------------
// Compatibility wrapper: legacy analyzeImage() for raster-to-svg.ts
// ---------------------------------------------------------------------------

/**
 * Legacy entry point. Calls computeSignals() and maps the result to the
 * old ImageAnalysis interface so that raster-to-svg.ts, trace.ts, and
 * build-svg.ts continue to work without modification.
 *
 * New code should call computeSignals() directly.
 */
export async function analyzeImage(
  png: Buffer,
  _hasAlphaHint: boolean,
): Promise<ImageAnalysis> {
  const signals = await computeSignals(png);

  // Map signal-based classification to legacy ImageClass values.
  // This preserves the contract expected by trace.ts and build-svg.ts
  // until Phase 2 replaces them with signal-based routing.
  const imageClass = signalsToLegacyClass(signals);

  return {
    imageClass,
    transparentRatio: signals.transparencyRatio,
    hasAlpha: signals.hasAlpha,
    isGrayscale: signals.isGrayscale,
    uniqueColorRatio: Math.min(1, signals.paletteSize / 200_000),
    edgeDensity: signals.edgeDensity,
  };
}

/**
 * Map ImageSignals to the legacy 4-value ImageClass.
 *
 * Rules (preserving original classification semantics):
 * - Grayscale + high edge density → "line-art"
 * - Grayscale + low edge density  → "mono"
 * - Non-grayscale + high detail   → "photo"
 * - Non-grayscale + transparency  → "color-logo"
 * - Otherwise                     → "color-logo"
 */
function signalsToLegacyClass(signals: ImageSignals): ImageClass {
  const detailed = signals.edgeDensity > 0.12 || signals.paletteSize > 50;

  if (signals.isGrayscale) {
    if (detailed) return signals.edgeDensity > 0.18 ? "line-art" : "mono";
    return "mono";
  }
  if (signals.hasTransparency && !detailed) return "color-logo";
  if (detailed) return "photo";
  return "color-logo";
}

// ---------------------------------------------------------------------------
// Legacy resolver
// ---------------------------------------------------------------------------

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
