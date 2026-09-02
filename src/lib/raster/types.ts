import "server-only";

export type RasterMode = "auto" | "logo" | "line-art" | "photo";

export type RasterQuality = "draft" | "standard" | "max";

export type RasterBackground = "preserve" | "transparent" | "custom";

export interface RasterOptions {
  mode: RasterMode;
  quality: RasterQuality;
  /** Target color count for color modes. 2-64. Omitted/auto lets the engine decide. */
  colorCount?: number;
  background: RasterBackground;
  /** Hex color used when background === "custom". */
  bgColor?: string;
}

export type ImageClass = "mono" | "line-art" | "color-logo" | "photo";

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
