import sharp from "sharp";
import { writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { rasterToSvg } from "../src/lib/raster/raster-to-svg";
import type { RasterOptions } from "../src/lib/raster/types";

async function makeImage(name: string, inner: string, alpha = false): Promise<Buffer> {
  const base = sharp({
    create: { width: 400, height: 400, channels: alpha ? 4 : 3, background: alpha ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toBuffer();
  const buf = await base;
  return sharp(buf).composite([{ input: Buffer.from(`<svg width="400" height="400">${inner}</svg>`), top: 0, left: 0 }]).png().toBuffer();
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "bench-"));
  const logo = await makeImage("logo", '<circle cx="200" cy="200" r="120" fill="#d94a1e"/><rect x="60" y="60" width="80" height="80" fill="#1e293b"/>');
  const lines = await makeImage("lines", '<path d="M40 360 Q200 40 360 360" stroke="black" stroke-width="10" fill="none"/><circle cx="200" cy="200" r="60" stroke="black" stroke-width="8" fill="none"/>');
  const photo = await makeImage("photo", '<defs><radialGradient id="g"><stop offset="0%" stop-color="yellow"/><stop offset="100%" stop-color="blue"/></radialGradient></defs><rect width="400" height="400" fill="url(#g)"/>');
  const trans = await makeImage("trans", '<circle cx="200" cy="200" r="120" fill="#16a34a"/>', true);

  const cases: Array<[string, Buffer, RasterOptions]> = [
    ["logo/auto", logo, { mode: "auto", quality: "standard", background: "preserve" }],
    ["logo/logo", logo, { mode: "logo", quality: "max", background: "preserve" }],
    ["lines/line-art", lines, { mode: "line-art", quality: "standard", background: "transparent" }],
    ["photo/auto", photo, { mode: "auto", quality: "standard", background: "preserve" }],
    ["photo/photo", photo, { mode: "photo", quality: "max", colorCount: 48, background: "custom", bgColor: "#ffffff" }],
    ["trans/auto", trans, { mode: "auto", quality: "standard", background: "preserve" }],
  ];

  for (const [label, buf, opts] of cases) {
    const t0 = Date.now();
    const res = await rasterToSvg(buf, opts);
    const ms = Date.now() - t0;
    const ok = res.svg.includes("<svg") && res.svg.includes("<path") && res.size > 0;
    writeFileSync(join(dir, `${label.replace("/", "_")}.svg`), res.svg);
    console.log(
      `${label.padEnd(16)} ok=${ok} class=${res.imageClass.padEnd(10)} colors=${String(res.colorCount).padStart(3)} ` +
        `${res.width}x${res.height} svg=${String(res.size).padStart(7)}B ${ms}ms${res.advisory ? " [advisory]" : ""}`,
    );
  }
  console.log("SVGs written to", dir);
}

main().catch((e) => {
  console.error("BENCH FAILED:", e);
  process.exit(1);
});
