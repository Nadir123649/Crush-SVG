import "server-only";
import type { DetectedBackground } from "./types";

/**
 * Detect the dominant background color by sampling edge AND interior pixels.
 * Enhanced from src/lib/png-to-svg.ts edge-only sampling to handle images
 * where the foreground touches edges and large background regions exist in
 * the interior (e.g. a blue icon on a white canvas with white behind it).
 *
 * Works on raw RGBA pixel data (Uint8ClampedArray).
 */
export function detectBackgroundColor(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): DetectedBackground {
  const samples: { r: number; g: number; b: number }[] = [];

  // ── 1. Edge/corner samples (original algorithm) ──────────────────────────
  const corners = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  for (const [x, y] of corners) {
    const i = (y * w + x) * 4;
    samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }

  for (let i = 0; i < 8; i++) {
    const t = Math.floor(((i + 1) / 9) * (w - 1));
    const ti = (0 * w + t) * 4;
    samples.push({ r: data[ti], g: data[ti + 1], b: data[ti + 2] });
    const bi = ((h - 1) * w + t) * 4;
    samples.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
    const li = (Math.floor((i * (h - 1)) / 7) * w + 0) * 4;
    samples.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
    const ri = (Math.floor((i * (h - 1)) / 7) * w + (w - 1)) * 4;
    samples.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
  }

  // ── 2. Interior grid samples ─────────────────────────────────────────────
  // Sample a grid of points across the full image interior so that large
  // uniform regions behind the foreground are also detected as background.
  // Grid density scales with image area but is capped to keep cost low.
  const gridCols = Math.min(16, Math.max(4, Math.ceil(w / 128)));
  const gridRows = Math.min(16, Math.max(4, Math.ceil(h / 128)));
  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      const x = Math.round(((gx + 0.5) / gridCols) * (w - 1));
      const y = Math.round(((gy + 0.5) / gridRows) * (h - 1));
      const i = (y * w + x) * 4;
      samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }
  }

  // ── 3. Cluster and find dominant color ───────────────────────────────────
  const clusters: { r: number; g: number; b: number; count: number }[] = [];
  for (const s of samples) {
    let merged = false;
    for (const c of clusters) {
      if (
        Math.abs(c.r - s.r) <= 10 &&
        Math.abs(c.g - s.g) <= 10 &&
        Math.abs(c.b - s.b) <= 10
      ) {
        c.r = (c.r * c.count + s.r) / (c.count + 1);
        c.g = (c.g * c.count + s.g) / (c.count + 1);
        c.b = (c.b * c.count + s.b) / (c.count + 1);
        c.count++;
        merged = true;
        break;
      }
    }
    if (!merged) clusters.push({ r: s.r, g: s.g, b: s.b, count: 1 });
  }

  clusters.sort((a, b) => b.count - a.count);
  const dominant = clusters[0];
  const coverage = dominant.count / samples.length;

  return {
    r: Math.round(dominant.r),
    g: Math.round(dominant.g),
    b: Math.round(dominant.b),
    coverage,
  };
}
