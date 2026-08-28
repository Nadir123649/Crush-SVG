import assert from "assert";
import sharp from "sharp";
import { rasterOptionsSchema } from "../src/lib/raster/validation";
import { analyzeImage } from "../src/lib/raster/analyze";
import { countSvgColors } from "../src/lib/raster/trace";
import { optimizeSvg } from "../src/lib/raster/optimize";
import { RASTER_LIMITS, sniffImageType } from "../src/lib/raster/limits";
import { rasterToSvg, recommendQueue } from "../src/lib/raster/raster-to-svg";
import { rasterQueueEnabled } from "../src/lib/raster/raster-queue";
import type { RasterOptions } from "../src/lib/raster/types";

let passed = 0;
let failed = 0;
async function check(name: string, fn: () => unknown) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (e) {
    failed++;
    console.error(`FAIL  ${name}: ${(e as Error).message}`);
  }
}

async function img(inner: string, alpha = false): Promise<Buffer> {
  const base = await sharp({ create: { width: 300, height: 300, channels: alpha ? 4 : 3, background: alpha ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255 } } }).png().toBuffer();
  return sharp(base).composite([{ input: Buffer.from(`<svg width="300" height="300">${inner}</svg>`), top: 0, left: 0 }]).png().toBuffer();
}

async function main() {
  console.log("limits & sniff");
  await check("sniff png/jpeg/gif/bmp", () => {
    assert.equal(sniffImageType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "png");
    assert.equal(sniffImageType(Buffer.from([0xff, 0xd8, 0xff])), "jpeg");
    assert.equal(sniffImageType(Buffer.from("GIF89a")), "gif");
    assert.equal(sniffImageType(Buffer.from("BM")), "bmp");
    assert.equal(sniffImageType(Buffer.from([0x00, 0x01])), null);
  });
  await check("limits caps", () => {
    assert.equal(RASTER_LIMITS.MAX_UPLOAD_BYTES, 12 * 1024 * 1024);
    assert.equal(RASTER_LIMITS.MAX_PIXELS_INLINE, 12_000_000);
  });

  console.log("validation schema");
  await check("valid auto", () => rasterOptionsSchema.parse({ mode: "auto", quality: "standard", background: "preserve" }));
  await check("colorCount bounds", () => {
    assert.throws(() => rasterOptionsSchema.parse({ mode: "auto", quality: "standard", background: "preserve", colorCount: 1 }));
    assert.throws(() => rasterOptionsSchema.parse({ mode: "auto", quality: "standard", background: "preserve", colorCount: 100 }));
    rasterOptionsSchema.parse({ mode: "auto", quality: "standard", background: "preserve", colorCount: 24 });
  });
  await check("custom requires bgColor", () => {
    assert.throws(() => rasterOptionsSchema.parse({ mode: "auto", quality: "standard", background: "custom" }));
    rasterOptionsSchema.parse({ mode: "auto", quality: "standard", background: "custom", bgColor: "#fff" });
  });

  console.log("analyze");
  await check("mono/line-art detection", async () => {
    const buf = await img('<circle cx="150" cy="150" r="80" fill="#000"/>');
    const a = await analyzeImage(buf, false);
    assert.ok(a.imageClass === "mono" || a.imageClass === "line-art", `got ${a.imageClass}`);
  });
  await check("color-logo detection", async () => {
    const buf = await img('<circle cx="150" cy="150" r="80" fill="#d94a1e"/><rect x="40" y="40" width="50" height="50" fill="#1e293b"/>');
    const a = await analyzeImage(buf, false);
    assert.equal(a.imageClass, "color-logo");
  });

  console.log("trace / optimize helpers");
  await check("countSvgColors parses", () => {
    const n = countSvgColors('<svg><path fill="#ff0000"/><path fill="#00ff00"/><path fill="none"/></svg>');
    assert.equal(n, 2);
  });
  await check("optimize removes degenerate", () => {
    const out = optimizeSvg('<svg><path d="M0,0" fill="red"/><path d="M1,1L2,2" fill="none" stroke="none"/></svg>');
    assert.ok(!out.includes('d="M0,0"'), "moveto-only removed");
  });

  console.log("queue gating");
  await check("queue disabled without redis/env", () => assert.equal(rasterQueueEnabled(), false));

  console.log("end-to-end rasterToSvg");
  const logo = await img('<circle cx="150" cy="150" r="90" fill="#d94a1e"/><rect x="40" y="40" width="60" height="60" fill="#1e293b"/>');
  await check("logo standard produces svg", async () => {
    const r = await rasterToSvg(logo, { mode: "logo", quality: "standard", background: "preserve" } as RasterOptions);
    assert.ok(r.svg.includes("<svg") && r.svg.includes("<path") && r.size > 0);
    assert.ok(r.width === 300 && r.height === 300);
  });
  await check("photo mode advisory", async () => {
    const photo = await img('<defs><radialGradient id="g"><stop offset="0%" stop-color="yellow"/><stop offset="100%" stop-color="blue"/></radialGradient></defs><rect width="300" height="300" fill="url(#g)"/>');
    const r = await rasterToSvg(photo, { mode: "photo", quality: "max", colorCount: 24, background: "custom", bgColor: "#ffffff" });
    assert.ok(r.advisory && r.advisory.length > 0, "advisory present for photo");
  });
  await check("large image downscaled within inline budget", async () => {
    const big = await sharp({ create: { width: 4000, height: 4000, channels: 3, background: "#fff" } }).png().toBuffer();
    assert.ok(await recommendQueue(big), "recommendQueue true for 16MP");
    const r = await rasterToSvg(big, { mode: "auto", quality: "standard", background: "preserve" } as RasterOptions, { isQueued: false });
    assert.ok(r.width * r.height <= RASTER_LIMITS.MAX_PIXELS_INLINE, `downscaled to ${r.width}x${r.height}`);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error("TEST CRASHED:", e);
  process.exit(1);
});
