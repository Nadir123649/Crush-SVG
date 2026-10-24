import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import JSZip from "jszip";
import sharp from "sharp";

const icons = [
  ["favicon-16x16.png", 16],
  ["favicon-32x32.png", 32],
  ["favicon-48x48.png", 48],
  ["apple-touch-icon.png", 180],
  ["android-chrome-192x192.png", 192],
  ["android-chrome-512x512.png", 512],
] as const;

const samples = [
  {
    name: "geometric shapes",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" rx="12" fill="#e65a24"/><circle cx="50" cy="50" r="20" fill="#fff"/></svg>',
  },
  {
    name: "non-square SVG",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#1668c7"/></svg>',
  },
  {
    name: "gradient with Gaussian blur",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g"><stop stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/></linearGradient><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs><circle cx="50" cy="50" r="25" fill="url(#g)" filter="url(#b)"/></svg>',
  },
  {
    name: "mask and clip path",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="c"><circle cx="50" cy="50" r="45"/></clipPath><mask id="m"><rect width="100" height="100" fill="white"/><circle cx="50" cy="50" r="15" fill="black"/></mask></defs><g clip-path="url(#c)" mask="url(#m)"><rect width="100" height="100" fill="#05a070"/></g></svg>',
  },
  {
    name: "transparent regions",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" fill="#00aaff"/></svg>',
  },
  {
    name: "complex path",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 4 C62 24 83 17 96 40 C76 49 88 72 67 95 C52 78 31 94 5 72 C22 55 6 36 28 19 C35 28 44 16 50 4Z" fill="#8728ad" stroke="#f4cf3e" stroke-width="4" stroke-linejoin="round" opacity=".92"/></svg>',
  },
  {
    name: "embedded text",
    svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect width="120" height="80" rx="12" fill="#111827"/><text x="60" y="53" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="#ffffff">SVG</text></svg>',
  },
  {
    name: "large SVG",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#e65a24" d="${Array.from({ length: 18000 }, (_, i) => `M${i % 512} ${Math.floor(i / 512) % 512}h1v1h-1z`).join("")}"/></svg>`,
  },
] as const;

async function waitForGeneration(page: import("@playwright/test").Page) {
  await expect(page.getByText("Rendering...", { exact: true })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("Pack Ready", { exact: true })).toBeVisible({ timeout: 30_000 });
}

async function downloadAndValidatePack(
  page: import("@playwright/test").Page,
  expectedAlpha: "any" | "transparent" | "opaque" | "soft" = "any",
  sampleName = "SVG",
) {
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Complete Favicon Pack (.ZIP)" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const zip = await JSZip.loadAsync(await fs.readFile(path!));

  for (const [name, size] of icons) {
    const file = zip.file(name);
    expect(file, `${name} should exist`).toBeTruthy();
    const bytes = await file!.async("nodebuffer");
    expect(bytes.byteLength).toBeGreaterThan(24);
    expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const metadata = await sharp(bytes).metadata();
    expect(metadata.width).toBe(size);
    expect(metadata.height).toBe(size);
    if (expectedAlpha === "transparent" || expectedAlpha === "soft") {
      expect(metadata.hasAlpha, `${name} should encode an alpha channel`).toBe(true);
      const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(data.some((_, index) => index % info.channels === 3 && data[index] === 0), `${name} should retain transparent pixels`).toBe(true);
    }

    if (name === "android-chrome-512x512.png") {
      const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let visible = 0;
      let transparent = 0;
      let partialAlpha = 0;
      const visibleColors = new Set<string>();
      for (let i = 3; i < data.length; i += info.channels) {
        if (data[i] > 0) visible++;
        if (data[i] === 0) transparent++;
        if (data[i] > 0 && data[i] < 255) partialAlpha++;
        if (data[i] > 0) {
          const pixel = i - 3;
          visibleColors.add(`${data[pixel] >> 4},${data[pixel + 1] >> 4},${data[pixel + 2] >> 4}`);
        }
      }
      expect(visible, `${sampleName} should have visible pixels in its 512px icon`).toBeGreaterThan(0);
      if (expectedAlpha === "transparent" || expectedAlpha === "soft") expect(transparent).toBeGreaterThan(0);
      if (expectedAlpha === "opaque") expect(transparent).toBe(0);
      if (expectedAlpha === "soft") expect(partialAlpha).toBeGreaterThan(0);
      if (sampleName === "gradient with Gaussian blur") expect(visibleColors.size).toBeGreaterThan(5);
    }
  }

  const ico = await zip.file("favicon.ico")!.async("nodebuffer");
  expect(ico.readUInt16LE(0)).toBe(0);
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(3);
  for (let i = 0; i < 3; i++) {
    const entry = 6 + i * 16;
    const size = ico[entry] || 256;
    const byteLength = ico.readUInt32LE(entry + 8);
    const offset = ico.readUInt32LE(entry + 12);
    expect(size).toBe([16, 32, 48][i]);
    expect(ico.subarray(offset, offset + 8).toString("hex")).toBe("89504e470d0a1a0a");
    const embeddedMetadata = await sharp(ico.subarray(offset, offset + byteLength)).metadata();
    expect(embeddedMetadata.width).toBe(size);
    expect(embeddedMetadata.height).toBe(size);
    if (expectedAlpha === "transparent" || expectedAlpha === "soft") {
      const { data, info } = await sharp(ico.subarray(offset, offset + byteLength)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(data.some((_, index) => index % info.channels === 3 && data[index] === 0), `ICO ${size}px entry should retain transparency`).toBe(true);
    }
  }

  const manifestFile = zip.file("site.webmanifest");
  expect(manifestFile).toBeTruthy();
  const manifest = JSON.parse(await manifestFile!.async("string")) as { icons: { src: string; sizes: string; type: string; purpose: string }[] };
  for (const icon of manifest.icons) {
    expect(zip.file(icon.src), `${icon.src} should exist in the package root`).toBeTruthy();
    expect(icon.type).toBe("image/png");
    expect(icon.purpose).toBe("any");
  }
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(["192x192", "512x512"]);

  const snippet = await zip.file("favicon-tags.html")!.async("string");
  for (const [, href] of snippet.matchAll(/href="\/([^\"]+)"/g)) {
    expect(zip.file(href), `${href} referenced by the HTML snippet should exist in the package`).toBeTruthy();
  }
  for (const [, size] of icons.slice(0, 3)) {
    expect(snippet).toContain(`sizes="${size}x${size}"`);
    expect(snippet).toContain(`href="/favicon-${size}x${size}.png"`);
  }
  expect(snippet).toContain('href="/favicon.ico"');
}

test.describe("favicon output fidelity and package validation", () => {
  test("generates valid, correctly sized assets for common SVG artwork", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The raster regression suite runs once in desktop Chromium.");
    test.setTimeout(240_000);
    await page.goto("/favicon-generator");
    const input = page.getByLabel("SVG input code");
    await expect(page.getByText("Pack Ready", { exact: true })).toBeVisible({ timeout: 30_000 });

    for (const sample of samples) {
      await input.fill(sample.svg);
      await expect(input).toHaveValue(sample.svg);
      await waitForGeneration(page);
      const alphaExpectation = ["transparent regions", "mask and clip path", "non-square SVG"].includes(sample.name)
        ? "transparent"
        : sample.name === "gradient with Gaussian blur"
          ? "soft"
          : "any";
      await downloadAndValidatePack(page, alphaExpectation, sample.name);
    }

    // contain is the default: a 4:3 SVG must retain transparent bands rather than stretch.
    await input.fill(samples[1].svg);
    await waitForGeneration(page);
    await downloadAndValidatePack(page, "transparent");

    // cover is opt-in and fills the square canvas by cropping the long edges.
    await page.getByLabel("Artwork fit").selectOption("cover");
    await waitForGeneration(page);
    await downloadAndValidatePack(page, "opaque");

    await page.getByLabel("Extra supersampling for small icons").check();
    await waitForGeneration(page);
    await downloadAndValidatePack(page, "opaque", "small-size supersampling");
  });

  test("shows a useful validation error for malformed pasted SVG", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The validation regression suite runs once in desktop Chromium.");
    await page.goto("/favicon-generator");
    await page.getByLabel("SVG input code").fill("<svg><path></svg>");
    await expect(page.getByRole("alert").filter({ hasText: "valid SVG markup" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download Complete Favicon Pack (.ZIP)" })).toBeDisabled();
  });
});
