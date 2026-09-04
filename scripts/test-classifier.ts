/**
 * Test script: verify the classifier routes portraits to MODNet and logos to legacy.
 *
 * Usage: npx tsx scripts/test-classifier.ts
 *
 * Generates synthetic test images:
 *  - Portrait: skin-tone patches, hair texture, uniform background
 *  - Logo: flat colored shapes on solid background, minimal texture
 */
import sharp from "sharp";

// Inline the classifier logic (no "server-only" import in script context)
// We replicate the exact logic from src/lib/bg-remove/classify.ts

function quantize(v: number): number {
  return (v >> 3) & 0x1f;
}
function colorKey(r: number, g: number, b: number): number {
  return (quantize(r) << 10) | (quantize(g) << 5) | quantize(b);
}
function hue(r: number, g: number, b: number): number {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
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
function saturation(r: number, g: number, b: number): number {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf);
  const l = (max + min) / 2;
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

type ImageStats = {
  uniqueColorRatio: number;
  avgGradientMagnitude: number;
  edgeUniformity: number;
  avgLocalVariance: number;
  skinToneRatio: number;
};

function computeStats(data: Uint8ClampedArray, w: number, h: number): ImageStats {
  const totalPixels = w * h;
  const targetSamples = 64_000;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / targetSamples)));

  const colorSet = new Set<number>();
  let sampledCount = 0, skinCount = 0;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a === 0) continue;
      colorSet.add(colorKey(r, g, b));
      sampledCount++;
      const h2 = hue(r, g, b), s = saturation(r, g, b);
      const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (h2 <= 50 && s >= 0.15 && s <= 0.80 && l >= 0.20 && l <= 0.85) skinCount++;
    }
  }
  const uniqueColorRatio = sampledCount > 0 ? colorSet.size / sampledCount : 0;
  const skinToneRatio = sampledCount > 0 ? skinCount / sampledCount : 0;

  // Gradients
  let gradientSum = 0, gradientCount = 0;
  const margin = Math.max(1, Math.floor(Math.min(w, h) * 0.02));
  const gridStep = Math.max(step, Math.floor(Math.sqrt(totalPixels / 16_000)));
  for (let y = margin; y < h - margin; y += gridStep) {
    for (let x = margin; x < w - margin; x += gridStep) {
      const i = (y * w + x) * 4;
      const iR = (y * w + (x + 1)) * 4;
      const iD = ((y + 1) * w + x) * 4;
      const lumC = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const lumR = data[iR] * 0.299 + data[iR + 1] * 0.587 + data[iR + 2] * 0.114;
      const lumD = data[iD] * 0.299 + data[iD + 1] * 0.587 + data[iD + 2] * 0.114;
      gradientSum += Math.abs(lumR - lumC) + Math.abs(lumD - lumC);
      gradientCount++;
    }
  }
  const avgGradientMagnitude = gradientCount > 0 ? gradientSum / gradientCount : 0;

  // Local variance
  let localVarSum = 0, localVarCount = 0;
  const patchStep = Math.max(step, Math.floor(Math.sqrt(totalPixels / 8_000)));
  for (let y = margin + 1; y < h - margin - 1; y += patchStep) {
    for (let x = margin + 1; x < w - margin - 1; x += patchStep) {
      const lums: number[] = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const pi = ((y + dy) * w + (x + dx)) * 4;
          lums.push(data[pi] * 0.299 + data[pi + 1] * 0.587 + data[pi + 2] * 0.114);
        }
      }
      const mean = lums.reduce((a, b) => a + b, 0) / 9;
      localVarSum += lums.reduce((a, v) => a + (v - mean) ** 2, 0) / 9;
      localVarCount++;
    }
  }
  const avgLocalVariance = localVarCount > 0 ? localVarSum / localVarCount : 0;

  // Edge uniformity
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
    let rS = 0, gS = 0, bS = 0;
    for (const p of edgePixels) { rS += p.r; gS += p.g; bS += p.b; }
    const rM = rS / edgePixels.length, gM = gS / edgePixels.length, bM = bS / edgePixels.length;
    let rV = 0, gV = 0, bV = 0;
    for (const p of edgePixels) {
      rV += (p.r - rM) ** 2; gV += (p.g - gM) ** 2; bV += (p.b - bM) ** 2;
    }
    const ev = (rV + gV + bV) / (3 * edgePixels.length);
    edgeUniformity = 1 - Math.min(1, Math.sqrt(ev) / 128);
  }

  return { uniqueColorRatio, avgGradientMagnitude, edgeUniformity, avgLocalVariance, skinToneRatio };
}

function classifyImage(data: Uint8ClampedArray, w: number, h: number): "photo" | "graphic" {
  const stats = computeStats(data, w, h);
  let photoScore = 0;

  if (stats.skinToneRatio > 0.08) photoScore += 5;
  else if (stats.skinToneRatio > 0.03) photoScore += 3;
  else if (stats.skinToneRatio > 0.01) photoScore += 1;

  if (stats.avgLocalVariance > 300) photoScore += 4;
  else if (stats.avgLocalVariance > 100) photoScore += 2;
  else if (stats.avgLocalVariance > 40) photoScore += 1;

  if (stats.uniqueColorRatio > 0.35) photoScore += 3;
  else if (stats.uniqueColorRatio > 0.20) photoScore += 2;
  else if (stats.uniqueColorRatio > 0.12) photoScore += 1;

  if (stats.edgeUniformity > 0.85 && stats.avgLocalVariance < 50) photoScore -= 3;
  else if (stats.edgeUniformity > 0.85 && stats.avgLocalVariance < 100) photoScore -= 1;
  if (stats.edgeUniformity < 0.40) photoScore += 2;

  if (stats.avgGradientMagnitude > 3 && stats.uniqueColorRatio > 0.15) photoScore += 1;

  if (stats.uniqueColorRatio < 0.05 && stats.avgLocalVariance < 20) photoScore -= 5;

  return photoScore >= 4 ? "photo" : "graphic";
}

// ── Synthetic image generators ───────────────────────────────────────────

/** Create a synthetic portrait: skin-tone face, hair, uniform background. */
async function createPortrait(w: number, h: number): Promise<Buffer> {
  const channels = 4;
  const pixels = w * h;
  const buf = Buffer.alloc(pixels * channels);

  // Fill with uniform studio background (light grey)
  for (let i = 0; i < pixels; i++) {
    buf[i * 4] = 230; buf[i * 4 + 1] = 230; buf[i * 4 + 2] = 235; buf[i * 4 + 3] = 255;
  }

  // Draw a "face" oval in the center with skin tones + texture
  const cx = Math.floor(w * 0.5);
  const cy = Math.floor(h * 0.38);
  const faceW = Math.floor(w * 0.35);
  const faceH = Math.floor(h * 0.30);

  for (let y = cy - faceH; y < cy + faceH; y++) {
    for (let x = cx - faceW; x < cx + faceW; x++) {
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const dx = (x - cx) / faceW;
      const dy = (y - cy) / faceH;
      if (dx * dx + dy * dy > 1) continue;

      const i = (y * w + x) * 4;
      // Skin tone with per-pixel noise for texture
      const noise = Math.sin(x * 0.3) * Math.cos(y * 0.25) * 15 + Math.sin(x * 1.7 + y * 0.9) * 8;
      buf[i] = Math.min(255, Math.max(0, Math.round(210 + noise)));     // R
      buf[i + 1] = Math.min(255, Math.max(0, Math.round(175 + noise))); // G
      buf[i + 2] = Math.min(255, Math.max(0, Math.round(145 + noise))); // B
      buf[i + 3] = 255;
    }
  }

  // Draw "hair" above face
  const hairY = cy - faceH - Math.floor(h * 0.05);
  const hairH = Math.floor(h * 0.10);
  for (let y = hairY; y < hairY + hairH && y < h; y++) {
    for (let x = cx - faceW - 5; x < cx + faceW + 5 && x >= 0 && x < w; x++) {
      const i = (y * w + x) * 4;
      const noise = Math.sin(x * 0.5 + y * 0.8) * 10;
      buf[i] = Math.min(255, Math.max(0, Math.round(60 + noise)));
      buf[i + 1] = Math.min(255, Math.max(0, Math.round(40 + noise)));
      buf[i + 2] = Math.min(255, Math.max(0, Math.round(30 + noise)));
      buf[i + 3] = 255;
    }
  }

  // Draw "shirt" below face
  const shirtY = cy + faceH;
  const shirtH = h - shirtY;
  for (let y = shirtY; y < h; y++) {
    for (let x = cx - faceW - 10; x < cx + faceW + 10 && x >= 0 && x < w; x++) {
      const i = (y * w + x) * 4;
      buf[i] = 50; buf[i + 1] = 80; buf[i + 2] = 140; buf[i + 3] = 255;
    }
  }

  return sharp(buf, { raw: { width: w, height: h, channels } }).png().toBuffer();
}

/** Create a synthetic logo: flat shapes, solid background, minimal texture. */
async function createLogo(w: number, h: number): Promise<Buffer> {
  const channels = 4;
  const pixels = w * h;
  const buf = Buffer.alloc(pixels * channels);

  // Fill with solid white background
  for (let i = 0; i < pixels; i++) {
    buf[i * 4] = 255; buf[i * 4 + 1] = 255; buf[i * 4 + 2] = 255; buf[i * 4 + 3] = 255;
  }

  // Draw a flat colored rectangle (logo shape)
  const lx = Math.floor(w * 0.1);
  const ly = Math.floor(h * 0.2);
  const lw = Math.floor(w * 0.8);
  const lh = Math.floor(h * 0.3);
  for (let y = ly; y < ly + lh && y < h; y++) {
    for (let x = lx; x < lx + lw && x < w; x++) {
      const i = (y * w + x) * 4;
      buf[i] = 0; buf[i + 1] = 100; buf[i + 2] = 200; buf[i + 3] = 255; // flat blue
    }
  }

  // Draw a flat colored circle
  const ccx = Math.floor(w * 0.5);
  const ccy = Math.floor(h * 0.7);
  const cr = Math.floor(Math.min(w, h) * 0.15);
  for (let y = ccy - cr; y <= ccy + cr; y++) {
    for (let x = ccx - cr; x <= ccx + cr; x++) {
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      if ((x - ccx) ** 2 + (y - ccy) ** 2 > cr * cr) continue;
      const i = (y * w + x) * 4;
      buf[i] = 220; buf[i + 1] = 50; buf[i + 2] = 50; buf[i + 3] = 255; // flat red
    }
  }

  return sharp(buf, { raw: { width: w, height: h, channels } }).png().toBuffer();
}

// ── Test runner ──────────────────────────────────────────────────────────

async function classifyBuffer(buf: Buffer): Promise<{ classification: string; stats: ImageStats }> {
  const decoded = await sharp(buf, { animated: false }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const data = new Uint8ClampedArray(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
  const w = decoded.info.width;
  const h = decoded.info.height;
  const stats = computeStats(data, w, h);
  const classification = classifyImage(data, w, h);
  return { classification, stats };
}

async function main() {
  console.log("=== Classifier Test ===\n");

  // Test 1: Portrait 225x300
  const portraitBuf = await createPortrait(225, 300);
  const portrait = await classifyBuffer(portraitBuf);
  console.log("Portrait 225x300:");
  console.log(`  Classification: ${portrait.classification}`);
  console.log(`  skinToneRatio:  ${portrait.stats.skinToneRatio.toFixed(4)}`);
  console.log(`  localVariance:  ${portrait.stats.avgLocalVariance.toFixed(2)}`);
  console.log(`  uniqueColors:   ${portrait.stats.uniqueColorRatio.toFixed(4)}`);
  console.log(`  edgeUniformity: ${portrait.stats.edgeUniformity.toFixed(4)}`);
  console.log(`  gradient:       ${portrait.stats.avgGradientMagnitude.toFixed(2)}`);
  const portraitPass = portrait.classification === "photo";
  console.log(`  Result: ${portraitPass ? "PASS (→ MODNet)" : "FAIL (→ legacy)"}\n`);

  // Test 2: Logo 4000x376
  const logoBuf = await createLogo(4000, 376);
  const logo = await classifyBuffer(logoBuf);
  console.log("Logo 4000x376:");
  console.log(`  Classification: ${logo.classification}`);
  console.log(`  skinToneRatio:  ${logo.stats.skinToneRatio.toFixed(4)}`);
  console.log(`  localVariance:  ${logo.stats.avgLocalVariance.toFixed(2)}`);
  console.log(`  uniqueColors:   ${logo.stats.uniqueColorRatio.toFixed(4)}`);
  console.log(`  edgeUniformity: ${logo.stats.edgeUniformity.toFixed(4)}`);
  console.log(`  gradient:       ${logo.stats.avgGradientMagnitude.toFixed(2)}`);
  const logoPass = logo.classification === "graphic";
  console.log(`  Result: ${logoPass ? "PASS (→ legacy)" : "FAIL (→ MODNet)"}\n`);

  // Test 3: Small portrait 150x200
  const smallPortraitBuf = await createPortrait(150, 200);
  const smallPortrait = await classifyBuffer(smallPortraitBuf);
  console.log("Small portrait 150x200:");
  console.log(`  Classification: ${smallPortrait.classification}`);
  console.log(`  skinToneRatio:  ${smallPortrait.stats.skinToneRatio.toFixed(4)}`);
  console.log(`  localVariance:  ${smallPortrait.stats.avgLocalVariance.toFixed(2)}`);
  const smallPass = smallPortrait.classification === "photo";
  console.log(`  Result: ${smallPass ? "PASS (→ MODNet)" : "FAIL (→ legacy)"}\n`);

  // Test 4: Text on solid background (simulated as flat colored blocks)
  const textBuf = await createLogo(800, 200);
  const text = await classifyBuffer(textBuf);
  console.log("Text/Logo 800x200:");
  console.log(`  Classification: ${text.classification}`);
  const textPass = text.classification === "graphic";
  console.log(`  Result: ${textPass ? "PASS (→ legacy)" : "FAIL (→ MODNet)"}\n`);

  // Summary
  const allPass = portraitPass && logoPass && smallPass && textPass;
  console.log(`=== Overall: ${allPass ? "ALL PASS" : "SOME FAILED"} ===`);

  if (!allPass) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
