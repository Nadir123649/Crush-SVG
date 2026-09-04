import "server-only";

/**
 * Lightweight image-type classifier that distinguishes photographic images
 * (portraits, landscapes) from graphic images (logos, text, flat artwork).
 *
 * Uses cheap pixel-statistics signals only — no ML, no external deps.
 * Returns "photo" for images best handled by MODNet, "graphic" for images
 * best handled by the legacy color-distance engine.
 *
 * Design principle: a photographic portrait must NEVER be classified as graphic.
 * When uncertain, prefer "graphic" only when there is no evidence of natural
 * image content.
 */

export type ImageClassification = "photo" | "graphic";

// ── Helpers ──────────────────────────────────────────────────────────────

/** Quantize a channel to 5 bits (32 levels) for color keying. */
function quantize(v: number): number {
  return (v >> 3) & 0x1f;
}

/** Pack quantized RGB into a 15-bit key. */
function colorKey(r: number, g: number, b: number): number {
  return (quantize(r) << 10) | (quantize(g) << 5) | quantize(b);
}

/** Convert RGB to HSL hue [0,360]. Returns hue in degrees. */
function hue(r: number, g: number, b: number): number {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === rf) h = ((gf - bf) / d) % 6;
  else if (max === gf) h = (bf - rf) / d + 2;
  else h = (rf - gf) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

/** Convert RGB to HSL saturation [0,1]. */
function saturation(r: number, g: number, b: number): number {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

// ── Stats ────────────────────────────────────────────────────────────────

interface ImageStats {
  /** Ratio of unique quantized colors among sampled pixels. */
  uniqueColorRatio: number;
  /** Average horizontal + vertical gradient magnitude (luminance). */
  avgGradientMagnitude: number;
  /** 1 - normalized edge variance. 1 = perfectly uniform border, 0 = chaotic. */
  edgeUniformity: number;
  /** Average local variance across sampled patches. Higher = more texture. */
  avgLocalVariance: number;
  /** Fraction of sampled pixels that fall in skin-tone hue range. */
  skinToneRatio: number;
}

/**
 * Compute cheap image statistics for classification.
 * Samples at most ~64k pixels regardless of image size.
 */
function computeStats(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): ImageStats {
  const totalPixels = w * h;

  // Adaptive step: sample ~64k pixels max for speed
  const targetSamples = 64_000;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / targetSamples)));

  // ── 1. Unique color count ──────────────────────────────────────
  const colorSet = new Set<number>();
  let sampledCount = 0;
  let skinCount = 0;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;
      colorSet.add(colorKey(r, g, b));
      sampledCount++;

      // Skin-tone detection: H 0-50°, S 0.15-0.8, L 0.2-0.85
      const h2 = hue(r, g, b);
      const s = saturation(r, g, b);
      const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (h2 <= 50 && s >= 0.15 && s <= 0.80 && l >= 0.20 && l <= 0.85) {
        skinCount++;
      }
    }
  }

  const uniqueColorRatio = sampledCount > 0 ? colorSet.size / sampledCount : 0;
  const skinToneRatio = sampledCount > 0 ? skinCount / sampledCount : 0;

  // ── 2. Edge gradient magnitude ─────────────────────────────────
  let gradientSum = 0;
  let gradientCount = 0;
  const margin = Math.max(1, Math.floor(Math.min(w, h) * 0.02));
  const gridStep = Math.max(step, Math.floor(Math.sqrt(totalPixels / 16_000)));

  for (let y = margin; y < h - margin; y += gridStep) {
    for (let x = margin; x < w - margin; x += gridStep) {
      const i = (y * w + x) * 4;
      const iRight = (y * w + (x + 1)) * 4;
      const iDown = ((y + 1) * w + x) * 4;
      const lumC = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const lumR = data[iRight] * 0.299 + data[iRight + 1] * 0.587 + data[iRight + 2] * 0.114;
      const lumD = data[iDown] * 0.299 + data[iDown + 1] * 0.587 + data[iDown + 2] * 0.114;
      gradientSum += Math.abs(lumR - lumC) + Math.abs(lumD - lumC);
      gradientCount++;
    }
  }
  const avgGradientMagnitude = gradientCount > 0 ? gradientSum / gradientCount : 0;

  // ── 3. Local variance (texture) ───────────────────────────────
  // For each sampled pixel, compute the variance of its 3×3 neighborhood.
  // Photos have high local variance (skin texture, hair, fabric weave).
  // Logos have flat fills with near-zero local variance.
  let localVarSum = 0;
  let localVarCount = 0;
  const patchStep = Math.max(step, Math.floor(Math.sqrt(totalPixels / 8_000)));

  for (let y = margin + 1; y < h - margin - 1; y += patchStep) {
    for (let x = margin + 1; x < w - margin - 1; x += patchStep) {
      // 3×3 neighborhood luminance
      const lums: number[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pi = ((y + dy) * w + (x + dx)) * 4;
          lums.push(data[pi] * 0.299 + data[pi + 1] * 0.587 + data[pi + 2] * 0.114);
        }
      }
      const mean = lums.reduce((a, b) => a + b, 0) / 9;
      const variance = lums.reduce((a, v) => a + (v - mean) ** 2, 0) / 9;
      localVarSum += variance;
      localVarCount++;
    }
  }
  const avgLocalVariance = localVarCount > 0 ? localVarSum / localVarCount : 0;

  // ── 4. Edge uniformity ─────────────────────────────────────────
  const edgePixels: { r: number; g: number; b: number }[] = [];
  const edgeStep = Math.max(1, Math.floor(Math.max(w, h) / 40));

  for (let x = 0; x < w; x += edgeStep) {
    edgePixels.push({ r: data[x * 4], g: data[x * 4 + 1], b: data[x * 4 + 2] });
    const bi = ((h - 1) * w + x) * 4;
    edgePixels.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
  }
  for (let y = 0; y < h; y += edgeStep) {
    const li = (y * w) * 4;
    edgePixels.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
    const ri = (y * w + (w - 1)) * 4;
    edgePixels.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
  }

  let edgeUniformity = 0.5;
  if (edgePixels.length > 1) {
    let rSum = 0, gSum = 0, bSum = 0;
    for (const p of edgePixels) { rSum += p.r; gSum += p.g; bSum += p.b; }
    const rMean = rSum / edgePixels.length;
    const gMean = gSum / edgePixels.length;
    const bMean = bSum / edgePixels.length;
    let rVar = 0, gVar = 0, bVar = 0;
    for (const p of edgePixels) {
      rVar += (p.r - rMean) ** 2;
      gVar += (p.g - gMean) ** 2;
      bVar += (p.b - bMean) ** 2;
    }
    const edgeVariance = (rVar + gVar + bVar) / (3 * edgePixels.length);
    edgeUniformity = 1 - Math.min(1, Math.sqrt(edgeVariance) / 128);
  }

  return {
    uniqueColorRatio,
    avgGradientMagnitude,
    edgeUniformity,
    avgLocalVariance,
    skinToneRatio,
  };
}

// ── Classifier ───────────────────────────────────────────────────────────

/**
 * Classify an image as "photo" (use MODNet) or "graphic" (use legacy engine).
 *
 * Signals ranked by discriminative power for portraits vs logos:
 * 1. Skin-tone presence — strongest single signal for portraits
 * 2. Local variance — photos have texture, logos have flat fills
 * 3. Unique color ratio — photos have many, logos have few
 * 4. Edge uniformity — logos have uniform borders (but photos can too with
 *    studio backgrounds, so this signal is weighted down when others disagree)
 * 5. Gradient magnitude — secondary signal, combined with color diversity
 *
 * A portrait with a solid studio background will still score high on signals
 * 1-3 and be correctly routed to MODNet.
 */
export function classifyImage(
  data: Uint8ClampedArray,
  w: number,
  h: number,
): ImageClassification {
  const stats = computeStats(data, w, h);

  let photoScore = 0;

  // ── Signal 1: Skin-tone presence ───────────────────────────────
  // Even 3-5% skin-tone pixels strongly indicate a portrait/photograph.
  // Logos almost never have skin tones.
  if (stats.skinToneRatio > 0.08) {
    photoScore += 5; // strong photo signal
  } else if (stats.skinToneRatio > 0.03) {
    photoScore += 3;
  } else if (stats.skinToneRatio > 0.01) {
    photoScore += 1;
  }

  // ── Signal 2: Local variance (texture) ─────────────────────────
  // Photos: avgLocalVariance typically 100-2000+ (skin, hair, fabric)
  // Logos: avgLocalVariance typically <30 (flat fills, gradients)
  if (stats.avgLocalVariance > 300) {
    photoScore += 4;
  } else if (stats.avgLocalVariance > 100) {
    photoScore += 2;
  } else if (stats.avgLocalVariance > 40) {
    photoScore += 1;
  }
  // Low texture → graphic (no penalty needed, just don't add)

  // ── Signal 3: Unique color ratio ───────────────────────────────
  if (stats.uniqueColorRatio > 0.35) {
    photoScore += 3;
  } else if (stats.uniqueColorRatio > 0.20) {
    photoScore += 2;
  } else if (stats.uniqueColorRatio > 0.12) {
    photoScore += 1;
  }

  // ── Signal 4: Edge uniformity ──────────────────────────────────
  // Uniform edges suggest logo/graphic, BUT a portrait on a studio
  // background also has uniform edges. Only penalize when combined
  // with low texture (logos have both uniform edges AND flat fills).
  if (stats.edgeUniformity > 0.85 && stats.avgLocalVariance < 50) {
    photoScore -= 3; // uniform edges + flat texture = definitely graphic
  } else if (stats.edgeUniformity > 0.85 && stats.avgLocalVariance < 100) {
    photoScore -= 1; // somewhat suspicious
  }
  // Varied edges boost photo score
  if (stats.edgeUniformity < 0.40) {
    photoScore += 2;
  }

  // ── Signal 5: Gradient + color diversity combo ─────────────────
  if (stats.avgGradientMagnitude > 3 && stats.uniqueColorRatio > 0.15) {
    photoScore += 1;
  }

  // ── Signal 6: Near-zero everything → definitely graphic ────────
  if (stats.uniqueColorRatio < 0.05 && stats.avgLocalVariance < 20) {
    photoScore -= 5;
  }

  // Photo needs score >= 4. This means at least 2 strong signals must agree.
  // Conservative: logos/text will never have skin tones OR high local variance,
  // so they'll never reach the threshold.
  return photoScore >= 4 ? "photo" : "graphic";
}
