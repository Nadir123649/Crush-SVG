import "server-only";

export type RasterMode = "auto" | "logo" | "line-art" | "photo";

export type RasterQuality = "draft" | "standard" | "max";

export type RasterBackground = "preserve" | "transparent" | "custom";

export interface RasterOptions {
  mode: RasterMode;
  quality: RasterQuality;
  /** Target color count for color modes. 2-128. Omitted/auto lets the engine decide. */
  colorCount?: number;
  background: RasterBackground;
  /** Hex color used when background === "custom". */
  bgColor?: string;
}

/**
 * Legacy image classification. Retained for backward compatibility with
 * trace.ts, build-svg.ts, and raster-to-svg.ts. Will be replaced by
 * signal-based routing in Phase 2.
 */
export type ImageClass = "mono" | "line-art" | "color-logo" | "photo";

/**
 * Composable image signals produced by computeSignals().
 * Each field is an independent measurement — no image is forced into a
 * single mutually-exclusive class.
 */
export interface ImageSignals {
  /** Fraction of sampled pixels whose RGB channels are sufficiently close (0..1). */
  grayness: number;
  /** Number of distinct quantized color buckets detected. */
  paletteSize: number;
  /** Fraction of sampled pixels that are edges — horizontal OR vertical (0..1). */
  edgeDensity: number;
  /** Fraction of sampled pixels with meaningful transparency (0..1). */
  transparencyRatio: number;
  /** True when any sampled pixel has alpha < 255. */
  hasAlpha: boolean;

  /** Derived: paletteSize < 12 AND edgeDensity < 0.08 */
  isLowComplexity: boolean;
  /** Derived: paletteSize > 100 OR edgeDensity > 0.20 */
  isHighComplexity: boolean;
  /** Derived: grayness > 0.92 */
  isGrayscale: boolean;
  /** Derived: transparencyRatio > 0.005 */
  hasTransparency: boolean;
}

export interface RasterResult {
  svg: string;
  width: number;
  height: number;
  /** The engine class that was actually used (after auto-resolution). */
  imageClass: ImageClass;
  /** Colors actually emitted (best-effort). */
  colorCount: number;
  /** Bytes of the produced SVG. */
  size: number;
  /** Advisory note for the caller (e.g. photo limitations). */
  advisory?: string;
}

export interface PreparedImage {
  /** PNG-encoded buffer with background already applied. */
  buffer: Buffer;
  width: number;
  height: number;
  hasAlpha: boolean;
  /** Pixels that are fully transparent (0 if opaque). */
  transparentRatio: number;
  imageClass: ImageClass;
}
