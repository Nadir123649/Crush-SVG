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
export async function analyzeImage(
  png: Buffer,
  hasAlpha: boolean,
  rawInput?: { data: Buffer | Uint8Array; width: number; height: number; channels: number }
): Promise<ImageAnalysis> {
  let data: Buffer | Uint8Array;
  let width: number;
  let height: number;
  let channels: number;

  if (rawInput) {
    data = rawInput.data;
    width = rawInput.width;
    height = rawInput.height;
    channels = rawInput.channels;
  } else {
    const res = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    data = res.data;
    width = res.info.width;
    height = res.info.height;
    channels = res.info.channels;
  }

  const count = width * height;
  const stride = Math.max(1, Math.floor(Math.sqrt(count / 200_000))); // ~200k samples cap
  const hasA = channels === 4;

  let transparent = 0;
  let edge = 0;
  let chromaticSamples = 0;
  let visibleSamples = 0;
  let edgeSamples = 0;
  const palette = new Set<number>();
  const grayPalette = new Set<number>();
  const at = (x: number, y: number) => (y * width + x) * channels;

  let sampled = 0;
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const i = at(x, y);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = hasA ? data[i + 3] : 255;
      if (a < 24) {
        transparent++;
        sampled++;
        continue;
      }
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min >= 18) chromaticSamples++;
      palette.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
      grayPalette.add(Math.round((0.299 * r + 0.587 * g + 0.114 * b) / 16));
      visibleSamples++;
      // edge test against right/down neighbor
      if (x + stride < width) {
        const j = at(x + stride, y);
        const neighborAlpha = hasA ? data[j + 3] : 255;
        if (neighborAlpha >= 24) {
          edgeSamples++;
          if (Math.abs(r - data[j]) + Math.abs(g - data[j + 1]) + Math.abs(b - data[j + 2]) > 48) edge++;
        }
      }
      sampled++;
    }
  }
  if (visibleSamples === 0) visibleSamples = 1;

  const transparentRatio = transparent / sampled;
  // Fully transparent pixels often contain black RGB values. Including them
  // made colorful cutouts look monochrome and sent them through the B/W tracer.
  // A mean saturation threshold misclassifies muted photos as grayscale.
  // Require nearly all visible pixels to be neutral before selecting B/W trace.
  const isGrayscale = chromaticSamples / visibleSamples < 0.03;
  // The ratio over all 4096 RGB buckets remains available as a diversity signal.
  const uniqueColorRatio = Math.min(1, palette.size / 4096);
  const grayToneRatio = Math.min(1, grayPalette.size / 16);
  const edgeDensity = edgeSamples === 0 ? 0 : edge / edgeSamples;

  return {
    imageClass: classify(isGrayscale, palette.size, uniqueColorRatio, grayToneRatio, edgeDensity),
    transparentRatio,
    hasAlpha: hasAlpha || transparentRatio > 0.001,
    isGrayscale,
    uniqueColorRatio,
    edgeDensity,
  };
}

function classify(
  isGrayscale: boolean,
  distinctColorBuckets: number,
  uniqueColorRatio: number,
  grayToneRatio: number,
  edgeDensity: number,
): ImageClass {
  if (isGrayscale) {
    // Photos and shaded drawings have many gray levels; keep those tonal
    // regions instead of forcing them through the binary black/white tracer.
    if (grayToneRatio > 0.65 && edgeDensity > 0.08) return "photo";
    if (edgeDensity > 0.15 || uniqueColorRatio > 0.25) return edgeDensity > 0.18 ? "line-art" : "mono";
    return "mono";
  }
  // JPEG compression, camera noise, skin, hair, and soft backgrounds can make
  // a photo's local edge density look deceptively low. A rich occupied palette
  // is a stronger signal than the old requirement for both high palette ratio
  // and high edge density (which made real photos fall through to poster art).
  if (distinctColorBuckets > 128 || uniqueColorRatio > 0.3) return "photo";
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
