import "server-only";
import type { DetectedBackground } from "./types";

/**
 * Detect the dominant background color by sampling edge AND interior pixels.
 * Enhanced to recognize when an image already has a transparent background,
 * avoiding corrupting or erasing existing transparent PNGs/SVGs.
 *
 * Works on raw RGBA pixel data (Uint8ClampedArray).
 */
export function detectBackgroundColor(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): DetectedBackground {
  const samples: { r: number; g: number; b: number; isBorder: boolean }[] = [];
  let transparentBorderSamples = 0;
  let totalBorderSamples = 0;

  // ── 1. Edge/corner samples (sample at border and 2px inset to handle 1px anti-aliased rims) ──
  const insets = [0, 2];
  for (const inset of insets) {
    if (w <= inset * 2 || h <= inset * 2) continue;
    const x0 = inset, x1 = w - 1 - inset;
    const y0 = inset, y1 = h - 1 - inset;

    const corners = [
      [x0, y0], [x1, y0], [x0, y1], [x1, y1]
    ];
    for (const [x, y] of corners) {
      totalBorderSamples++;
      const i = (y * w + x) * 4;
      if (data[i + 3] < 128) {
        transparentBorderSamples++;
      } else {
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2], isBorder: true });
      }
    }

    for (let i = 0; i < 8; i++) {
      const tx = Math.floor(x0 + ((i + 1) / 9) * (x1 - x0));
      const ty = Math.floor(y0 + ((i + 1) / 9) * (y1 - y0));

      const ti = (y0 * w + tx) * 4;
      totalBorderSamples++;
      if (data[ti + 3] < 128) transparentBorderSamples++;
      else samples.push({ r: data[ti], g: data[ti + 1], b: data[ti + 2], isBorder: true });

      const bi = (y1 * w + tx) * 4;
      totalBorderSamples++;
      if (data[bi + 3] < 128) transparentBorderSamples++;
      else samples.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2], isBorder: true });

      const li = (ty * w + x0) * 4;
      totalBorderSamples++;
      if (data[li + 3] < 128) transparentBorderSamples++;
      else samples.push({ r: data[li], g: data[li + 1], b: data[li + 2], isBorder: true });

      const ri = (ty * w + x1) * 4;
      totalBorderSamples++;
      if (data[ri + 3] < 128) transparentBorderSamples++;
      else samples.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2], isBorder: true });
    }
  }

  // ── 2. Interior grid samples ─────────────────────────────────────────────
  const gridCols = Math.min(16, Math.max(4, Math.ceil(w / 128)));
  const gridRows = Math.min(16, Math.max(4, Math.ceil(h / 128)));
  let transparentInteriorSamples = 0;
  let totalInteriorSamples = 0;

  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      const x = Math.round(((gx + 0.5) / gridCols) * (w - 1));
      const y = Math.round(((gy + 0.5) / gridRows) * (h - 1));
      const i = (y * w + x) * 4;
      totalInteriorSamples++;
      if (data[i + 3] < 128) {
        transparentInteriorSamples++;
      } else {
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2], isBorder: false });
      }
    }
  }

  // ── 3. Cluster and find dominant color ───────────────────────────────────
  if (samples.length === 0) {
    return { r: 0, g: 0, b: 0, coverage: 1, isTransparent: true };
  }

  const clusters: { r: number; g: number; b: number; count: number; borderCount: number }[] = [];
  for (const s of samples) {
    let merged = false;
    for (const c of clusters) {
      if (
        Math.abs(c.r - s.r) <= 12 &&
        Math.abs(c.g - s.g) <= 12 &&
        Math.abs(c.b - s.b) <= 12
      ) {
        c.r = (c.r * c.count + s.r) / (c.count + 1);
        c.g = (c.g * c.count + s.g) / (c.count + 1);
        c.b = (c.b * c.count + s.b) / (c.count + 1);
        c.count++;
        if (s.isBorder) c.borderCount++;
        merged = true;
        break;
      }
    }
    if (!merged) {
      clusters.push({
        r: s.r,
        g: s.g,
        b: s.b,
        count: 1,
        borderCount: s.isBorder ? 1 : 0,
      });
    }
  }

  // The true background of an image begins at its perimeter.
  // Prioritize clusters with the highest borderCount so large central foreground subjects
  // are never misclassified as the background.
  clusters.sort((a, b) => {
    if (b.borderCount !== a.borderCount) {
      return b.borderCount - a.borderCount;
    }
    return b.count - a.count;
  });

  const dominant = clusters[0];
  const coverage = dominant.count / samples.length;
  const borderTransparentRatio = totalBorderSamples > 0 ? transparentBorderSamples / totalBorderSamples : 0;
  const overallTransparentRatio =
    totalBorderSamples + totalInteriorSamples > 0
      ? (transparentBorderSamples + transparentInteriorSamples) / (totalBorderSamples + totalInteriorSamples)
      : 0;

  // An image is already transparent (a cutout) if:
  // - Either the overall image is dominantly transparent (>= 50%)
  // - OR the border is dominantly transparent (>= 60%) AND overall transparency is substantial (>= 20%)
  const isTransparent =
    overallTransparentRatio >= 0.50 ||
    (borderTransparentRatio >= 0.60 && overallTransparentRatio >= 0.20);

  if (isTransparent) {
    return {
      r: Math.round(dominant.r),
      g: Math.round(dominant.g),
      b: Math.round(dominant.b),
      coverage: 1,
      isTransparent: true,
    };
  }

  return {
    r: Math.round(dominant.r),
    g: Math.round(dominant.g),
    b: Math.round(dominant.b),
    coverage,
    isTransparent: false,
  };
}
