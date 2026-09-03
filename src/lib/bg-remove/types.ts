import "server-only";

export type BgRemoveMode = "Transparent" | "White" | "Black" | "Custom";

export type BgRemoveScale = 25 | 50 | 75 | 100 | 125 | 150 | 200;

export interface BgRemoveOptions {
  mode: BgRemoveMode;
  scale: BgRemoveScale;
  bgColor?: string;
}

export interface BgRemoveResult {
  dataUrl: string;
  format: string;
  size: number;
  width: number;
  height: number;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface DetectedBackground extends RgbColor {
  coverage: number;
}
