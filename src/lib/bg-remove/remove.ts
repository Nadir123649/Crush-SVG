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
 * connected to the perimeter that match the detected background color.
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

  // If the image already has a transparent background, do not delete the foreground
  if (bg.isTransparent) return out;

  // Lowered from 0.05 to 0.01 — attempt removal even when bg detection is weak
  // (e.g. gradient backgrounds or images with many foreground edge pixels)
  if (bg.coverage < 0.01) {
    return out;
  }

  const distSq = (r: number, g: number, b: number) =>
    (r - bg.r) ** 2 + (g - bg.g) ** 2 + (b - bg.b) ** 2;
  const thresholdSq = threshold * threshold;
  const featherDistSq = (threshold + 16) * (threshold + 16);

  const totalPixels = w * h;
  const visited = new Uint8Array(totalPixels);
  // Queue needs to be larger for 8-directional BFS (worst case: all pixels)
  const queue = new Int32Array(totalPixels);
  let head = 0;
  let tail = 0;

  function tryEnqueue(x: number, y: number) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const idx = y * w + x;
    if (visited[idx]) return;
    const pi = idx * 4;
    const a = out[pi + 3];
    if (a === 0) {
      visited[idx] = 1;
      return;
    }
    const dSq = distSq(out[pi], out[pi + 1], out[pi + 2]);
    if (dSq <= thresholdSq) {
      visited[idx] = 1;
      queue[tail++] = idx;
    } else if (dSq <= featherDistSq) {
      // Semi-transparent edge feathering for perimeter pixels
      const dist = Math.sqrt(dSq);
      const featherAlpha = Math.min(255, Math.round(((dist - threshold) / 16) * a));
      if (featherAlpha < out[pi + 3]) {
        out[pi + 3] = featherAlpha;
      }
      visited[idx] = 1;
    }
  }

  // Seed BFS queue with pixels along all four borders
  for (let x = 0; x < w; x++) {
    tryEnqueue(x, 0);
    tryEnqueue(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryEnqueue(0, y);
    tryEnqueue(w - 1, y);
  }

  // 8-directional BFS flood-fill (includes diagonals) — fixes jagged/rough edges
  // where 4-directional BFS left behind diagonal background corner pixels
  while (head < tail) {
    const idx = queue[head++];
    const x = idx % w;
    const y = Math.floor(idx / w);
    out[idx * 4 + 3] = 0; // erase connected background pixel

    // 4 cardinal directions
    tryEnqueue(x - 1, y);
    tryEnqueue(x + 1, y);
    tryEnqueue(x, y - 1);
    tryEnqueue(x, y + 1);
    // 4 diagonal directions (new — fixes jagged corner artifacts)
    tryEnqueue(x - 1, y - 1);
    tryEnqueue(x + 1, y - 1);
    tryEnqueue(x - 1, y + 1);
    tryEnqueue(x + 1, y + 1);
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
  const { r: tr, g: tg, b: tb } = hexToRgb(hex);

  // If not already transparent, first remove the connected background to transparent
  const transparentCutout = bg.isTransparent
    ? data
    : removeBackground(data, w, h, bg, threshold);

  const out = new Uint8ClampedArray(transparentCutout);

  // Composite over the target solid background color
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
