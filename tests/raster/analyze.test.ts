import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { computeSignals, analyzeImage } from "../../src/lib/raster/analyze";
import type { ImageSignals } from "../../src/lib/raster/types";

// ---------------------------------------------------------------------------
// Helpers: generate test images via sharp (no fixture files needed)
// ---------------------------------------------------------------------------

/** Solid-fill RGB image. */
async function solidImage(w: number, h: number, r: number, g: number, b: number): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();
}

/** Solid-fill RGBA image. */
async function solidRGBA(w: number, h: number, r: number, g: number, b: number, a: number): Promise<Buffer> {
  return sharp({ create: { width: w, height: h, channels: 4, background: { r, g, b, alpha: a / 255 } } })
    .png()
    .toBuffer();
}

/** Two-color horizontal split: left half = color1, right half = color2. */
async function hSplit(w: number, h: number, c1: [number, number, number], c2: [number, number, number]): Promise<Buffer> {
  const left = await sharp({ create: { width: Math.ceil(w / 2), height: h, channels: 3, background: { r: c1[0], g: c1[1], b: c1[2] } } }).raw().toBuffer();
  const right = await sharp({ create: { width: Math.floor(w / 2), height: h, channels: 3, background: { r: c2[0], g: c2[1], b: c2[2] } } }).raw().toBuffer();
  const combined = Buffer.concat([left, right]);
  return sharp(combined, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
}

/** Two-color vertical split: top half = color1, bottom half = color2. */
async function vSplit(w: number, h: number, c1: [number, number, number], c2: [number, number, number]): Promise<Buffer> {
  const top = await sharp({ create: { width: w, height: Math.ceil(h / 2), channels: 3, background: { r: c1[0], g: c1[1], b: c1[2] } } }).raw().toBuffer();
  const bottom = await sharp({ create: { width: w, height: Math.floor(h / 2), channels: 3, background: { r: c2[0], g: c2[1], b: c2[2] } } }).raw().toBuffer();
  const combined = Buffer.concat([top, bottom]);
  return sharp(combined, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer();
}

/** Checkerboard pattern: alternating two colors per pixel. */
async function checkerboard(w: number, h: number, c1: [number, number, number], c2: [number, number, number]): Promise<Buffer> {
  const channels = 3;
  const buf = Buffer.alloc(w * h * channels);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const useC2 = (x + y) % 2 === 1;
      const c = useC2 ? c2 : c1;
      const idx = (y * w + x) * channels;
      buf[idx] = c[0];
      buf[idx + 1] = c[1];
      buf[idx + 2] = c[2];
    }
  }
  return sharp(buf, { raw: { width: w, height: h, channels } }).png().toBuffer();
}

/** Many-color gradient: R varies 0..255 across columns, G varies 0..255 across rows. */
async function gradientImage(w: number, h: number): Promise<Buffer> {
  const channels = 3;
  const buf = Buffer.alloc(w * h * channels);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * channels;
      buf[idx] = Math.round((x / (w - 1)) * 255);     // R: horizontal gradient
      buf[idx + 1] = Math.round((y / (h - 1)) * 255); // G: vertical gradient
      buf[idx + 2] = 128;                                // B: constant
    }
  }
  return sharp(buf, { raw: { width: w, height: h, channels } }).png().toBuffer();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("computeSignals", () => {
  describe("grayness / isGrayscale", () => {
    it("detects a solid gray image as grayscale", async () => {
      const buf = await solidImage(64, 64, 128, 128, 128);
      const s = await computeSignals(buf);
      expect(s.isGrayscale).toBe(true);
      expect(s.grayness).toBeGreaterThan(0.92);
    });

    it("detects a solid red image as not grayscale", async () => {
      const buf = await solidImage(64, 64, 255, 0, 0);
      const s = await computeSignals(buf);
      expect(s.isGrayscale).toBe(false);
      expect(s.grayness).toBeLessThan(0.5);
    });

    it("detects near-gray (slight color variation) correctly", async () => {
      // RGB channels differ by at most 5 out of 255 → should still be grayscale
      const buf = await solidImage(64, 64, 128, 130, 126);
      const s = await computeSignals(buf);
      expect(s.isGrayscale).toBe(true);
    });
  });

  describe("paletteSize / color bucketing", () => {
    it("returns paletteSize=1 for a solid color", async () => {
      const buf = await solidImage(64, 64, 100, 150, 200);
      const s = await computeSignals(buf);
      expect(s.paletteSize).toBe(1);
    });

    it("returns paletteSize=2 for a two-color split", async () => {
      const buf = await hSplit(64, 64, [255, 0, 0], [0, 0, 255]);
      const s = await computeSignals(buf);
      expect(s.paletteSize).toBe(2);
    });

    it("detects many colors in a gradient image", async () => {
      const buf = await gradientImage(64, 64);
      const s = await computeSignals(buf);
      // 64×64 gradient should produce many distinct buckets
      expect(s.paletteSize).toBeGreaterThan(50);
    });

    it("uses improved 32768-bucket quantization (5 bits per channel)", async () => {
      // Two colors that differ only in the lowest 3 bits of one channel.
      // Old 4096-bucket (>>4) would merge them; new 32768-bucket (>>3) separates them.
      const buf1 = await solidImage(64, 64, 100, 100, 100);
      const buf2 = await solidImage(64, 64, 103, 100, 100); // differs by 3 in R
      const buf = await hSplit(128, 64, [100, 100, 100], [103, 100, 100]);
      const s = await computeSignals(buf);
      // With 5-bit bucketing (>>3), 100>>3=12 and 103>>3=12 — same bucket.
      // But 100>>3=12 and 110>>3=13 — different buckets.
      const buf2Split = await hSplit(128, 64, [100, 100, 100], [110, 100, 100]);
      const s2 = await computeSignals(buf2Split);
      expect(s2.paletteSize).toBe(2);
    });
  });

  describe("edgeDensity", () => {
    it("reports zero edge density for a solid image", async () => {
      const buf = await solidImage(64, 64, 128, 128, 128);
      const s = await computeSignals(buf);
      expect(s.edgeDensity).toBe(0);
    });

    it("detects horizontal edges (right neighbour)", async () => {
      // High-contrast horizontal split: left black, right white
      const buf = await hSplit(64, 64, [0, 0, 0], [255, 255, 255]);
      const s = await computeSignals(buf);
      expect(s.edgeDensity).toBeGreaterThan(0.01);
    });

    it("detects vertical edges (down neighbour)", async () => {
      // High-contrast vertical split: top black, bottom white
      const buf = await vSplit(64, 64, [0, 0, 0], [255, 255, 255]);
      const s = await computeSignals(buf);
      expect(s.edgeDensity).toBeGreaterThan(0.01);
    });

    it("reports high edge density for a checkerboard", async () => {
      const buf = await checkerboard(64, 64, [0, 0, 0], [255, 255, 255]);
      const s = await computeSignals(buf);
      // Checkerboard: every pixel has neighbours of the opposite color
      expect(s.edgeDensity).toBeGreaterThan(0.4);
    });
  });

  describe("transparency / hasAlpha", () => {
    it("reports no transparency for an opaque RGB image", async () => {
      const buf = await solidImage(64, 64, 128, 128, 128);
      const s = await computeSignals(buf);
      expect(s.hasAlpha).toBe(false);
      expect(s.hasTransparency).toBe(false);
      expect(s.transparencyRatio).toBe(0);
    });

    it("detects fully transparent pixels in an RGBA image", async () => {
      const buf = await solidRGBA(64, 64, 255, 0, 0, 0);
      const s = await computeSignals(buf);
      expect(s.hasAlpha).toBe(true);
      expect(s.hasTransparency).toBe(true);
      expect(s.transparencyRatio).toBeGreaterThan(0.5);
    });

    it("does not flag near-opaque pixels as transparent", async () => {
      // Alpha = 240 (> 200 threshold) → should not count as transparent
      const buf = await solidRGBA(64, 64, 255, 0, 0, 240);
      const s = await computeSignals(buf);
      expect(s.transparencyRatio).toBe(0);
      expect(s.hasTransparency).toBe(false);
      // But hasAlpha should still be true because channel exists
      expect(s.hasAlpha).toBe(true);
    });

    it("detects semi-transparent pixels (alpha=128)", async () => {
      const buf = await solidRGBA(64, 64, 255, 0, 0, 128);
      const s = await computeSignals(buf);
      expect(s.hasTransparency).toBe(true);
      expect(s.transparencyRatio).toBeGreaterThan(0.5);
    });
  });

  describe("derived signals", () => {
    it("isLowComplexity for a solid image", async () => {
      const buf = await solidImage(64, 64, 128, 128, 128);
      const s = await computeSignals(buf);
      expect(s.isLowComplexity).toBe(true);
      expect(s.isHighComplexity).toBe(false);
    });

    it("isHighComplexity for a checkerboard", async () => {
      const buf = await checkerboard(64, 64, [0, 0, 0], [255, 255, 255]);
      const s = await computeSignals(buf);
      // Checkerboard: paletteSize=2 (< 12), but edgeDensity > 0.20
      expect(s.isHighComplexity).toBe(true);
      expect(s.isLowComplexity).toBe(false);
    });

    it("isHighComplexity for a many-color gradient", async () => {
      const buf = await gradientImage(128, 128);
      const s = await computeSignals(buf);
      // Gradient: paletteSize > 100
      expect(s.isHighComplexity).toBe(true);
    });

    it("isLowComplexity for a simple two-color image with smooth boundary", async () => {
      // Two large uniform regions with one boundary → low edge density, few colors
      const buf = await hSplit(128, 128, [200, 200, 200], [195, 195, 195]);
      const s = await computeSignals(buf);
      // paletteSize: 2 (< 12), edgeDensity: ~0.008 (< 0.08)
      expect(s.isLowComplexity).toBe(true);
    });
  });

  describe("tiny images", () => {
    it("handles a 32×32 image", async () => {
      const buf = await solidImage(32, 32, 100, 150, 200);
      const s = await computeSignals(buf);
      expect(s.paletteSize).toBe(1);
      expect(s.isGrayscale).toBe(false);
      expect(s.hasAlpha).toBe(false);
    });

    it("handles a 1×1 image", async () => {
      const buf = await solidImage(1, 1, 50, 100, 150);
      const s = await computeSignals(buf);
      expect(s.paletteSize).toBe(1);
      expect(s.edgeDensity).toBe(0);
    });
  });

  describe("determinism", () => {
    it("returns identical signals for the same input", async () => {
      const buf = await gradientImage(64, 64);
      const s1 = await computeSignals(buf);
      const s2 = await computeSignals(buf);
      expect(s1).toEqual(s2);
    });
  });
});

describe("analyzeImage (legacy compatibility wrapper)", () => {
  it("returns a valid ImageAnalysis with legacy imageClass values", async () => {
    const buf = await solidImage(64, 64, 128, 128, 128);
    const a = await analyzeImage(buf, false);
    expect(["mono", "line-art", "color-logo", "photo"]).toContain(a.imageClass);
    expect(typeof a.transparentRatio).toBe("number");
    expect(typeof a.hasAlpha).toBe("boolean");
    expect(typeof a.isGrayscale).toBe("boolean");
    expect(typeof a.uniqueColorRatio).toBe("number");
    expect(typeof a.edgeDensity).toBe("number");
  });

  it("maps grayscale to mono/line-art", async () => {
    const buf = await solidImage(64, 64, 128, 128, 128);
    const a = await analyzeImage(buf, false);
    expect(a.imageClass === "mono" || a.imageClass === "line-art").toBe(true);
    expect(a.isGrayscale).toBe(true);
  });

  it("maps colorful non-detailed to color-logo", async () => {
    const buf = await solidImage(64, 64, 255, 100, 50);
    const a = await analyzeImage(buf, false);
    expect(a.imageClass).toBe("color-logo");
  });

  it("preserves transparentRatio from signals", async () => {
    const buf = await solidRGBA(64, 64, 255, 0, 0, 0);
    const a = await analyzeImage(buf, false);
    expect(a.transparentRatio).toBeGreaterThan(0.5);
    expect(a.hasAlpha).toBe(true);
  });
});
