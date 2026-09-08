import "server-only";
import type { DetectedBackground, RgbColor } from "./types";

function hexToRgb(hex: string): RgbColor {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/**
 * Remove background pixels by setting alpha to 0 for pixels
 * close to the detected background color.
 * If the image already has a transparent background, preserves all pixels as-is.
 */
export function removeBackground(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  bg: DetectedBackground,
  threshold = 42,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);

  // If the image already has a transparent background, do not delete the foreground!
  if (bg.isTransparent) return out;

  if (bg.coverage < 0.05) return out;

  const distSq = (r: number, g: number, b: number) =>
    (r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2;
  const thresholdSq = threshold * threshold;

  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];

    if (a === 0) continue;

    if (distSq(r, g, b) <= thresholdSq) {
      out[i + 3] = 0;
    }
  }

  return out;
}

/**
 * Replace background pixels with a target color.
 * If the image already has a transparent background, cleanly composites
 * the transparent/semi-transparent areas onto the target color, preserving the foreground.
 */
export function replaceBackgroundWithColor(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  bg: DetectedBackground,
  hex: string,
  threshold = 42,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  const { r: tr, g: tg, b: tb } = hexToRgb(hex);

  // When the image already has a transparent background, fill transparent pixels with target color
  if (bg.isTransparent) {
    for (let i = 0; i < out.length; i += 4) {
      const a = out[i + 3];
      if (a === 0) {
        out[i] = tr;
        out[i + 1] = tg;
        out[i + 2] = tb;
        out[i + 3] = 255;
      } else if (a < 255) {
        const alpha = a / 255;
        out[i] = Math.round(out[i] * alpha + tr * (1 - alpha));
        out[i + 1] = Math.round(out[i + 1] * alpha + tg * (1 - alpha));
        out[i + 2] = Math.round(out[i + 2] * alpha + tb * (1 - alpha));
        out[i + 3] = 255;
      }
    }
    return out;
  }

  // When the image has an opaque detected background, replace matching pixels and any transparent pixels
  const distSq = (r: number, g: number, b: number) =>
    (r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2;
  const thresholdSq = threshold * threshold;

  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const a = out[i + 3];

    if (a === 0 || distSq(r, g, b) <= thresholdSq) {
      out[i] = tr;
      out[i + 1] = tg;
      out[i + 2] = tb;
      out[i + 3] = 255;
    }
  }

  return out;
}

/** Normalize a hex string to #RRGGBB uppercase. */
export function normalizeHex(input: string): string {
  let hex = input.trim();
  if (!hex.startsWith("#")) hex = "#" + hex;
  if (hex.length === 4) {
    hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toUpperCase();
  return "#FFFFFF";
}

/** Map a bgOption string to its processing mode. */
export function resolveBgColor(bgOption: string, bgColor?: string): string {
  switch (bgOption) {
    case "White":
      return "#FFFFFF";
    case "Black":
      return "#000000";
    case "Custom":
      return normalizeHex(bgColor ?? "#FFFFFF");
    default:
      return "";
  }
}
