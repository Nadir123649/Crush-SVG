/**
 * Standalone test script for the MODNet background-removal pipeline.
 *
 * Usage:
 *   BG_REMOVE_USE_MODNET=true npx tsx scripts/test-modnet.ts <image-path>
 *
 * If no image path is provided, a synthetic test image is generated.
 */
import "server-only";
import sharp from "sharp";
import { processWithModnet } from "../src/lib/bg-remove/modnet";

async function createSyntheticPortrait(): Promise<Buffer> {
  // Create a 400x600 image with a gradient background and a simple shape
  const width = 400;
  const height = 600;
  const channels = 3;
  const data = new Uint8Array(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      // Gradient background (light blue to blue)
      const bgR = 100 + Math.floor((y / height) * 50);
      const bgG = 150 + Math.floor((y / height) * 50);
      const bgB = 200 + Math.floor((y / height) * 55);

      // Draw an ellipse in the center (simulating a person)
      const cx = width / 2;
      const cy = height * 0.4;
      const rx = 80;
      const ry = 120;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = dx * dx + dy * dy;

      if (dist <= 1) {
        // "Skin" color inside the ellipse
        data[i] = 220;
        data[i + 1] = 180;
        data[i + 2] = 150;
      } else {
        // Background gradient
        data[i] = bgR;
        data[i + 1] = bgG;
        data[i + 2] = bgB;
      }
    }
  }

  return sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

async function main() {
  const imagePath = process.argv[2];
  let inputBuffer: Buffer;
  let label: string;

  if (imagePath) {
    const fs = await import("node:fs/promises");
    inputBuffer = await fs.readFile(imagePath);
    label = imagePath;
  } else {
    console.log("No image path provided, generating synthetic test image...");
    inputBuffer = await createSyntheticPortrait();
    label = "synthetic-portrait-400x600";
  }

  console.log(`\nTesting MODNet background removal on: ${label}`);
  console.log(`Input size: ${(inputBuffer.length / 1024).toFixed(1)} KB`);

  const startTime = Date.now();

  const result = await processWithModnet(inputBuffer, {
    bgOption: "Transparent",
    scale: 100,
  });

  const elapsed = Date.now() - startTime;

  console.log(`\n--- Results ---`);
  console.log(`Output dimensions: ${result.width} x ${result.height}`);
  console.log(`Output size: ${(result.size / 1024).toFixed(1)} KB`);
  console.log(`Inference time: ${elapsed} ms`);
  console.log(`Format: ${result.format}`);

  // Verify output has alpha channel
  const outputMeta = await sharp(Buffer.from(result.dataUrl.split(",")[1], "base64")).metadata();
  console.log(`Channels: ${outputMeta.channels}`);
  console.log(`Has alpha: ${outputMeta.hasAlpha}`);

  if (outputMeta.hasAlpha) {
    // Check that some pixels are transparent (alpha < 255)
    const rawOutput = await sharp(Buffer.from(result.dataUrl.split(",")[1], "base64"))
      .raw()
      .toBuffer({ resolveWithObject: true });

    let transparentCount = 0;
    let semiTransparentCount = 0;
    let opaqueCount = 0;
    const totalPixels = result.width * result.height;

    for (let i = 0; i < rawOutput.data.length; i += 4) {
      const a = rawOutput.data[i + 3];
      if (a === 0) transparentCount++;
      else if (a < 255) semiTransparentCount++;
      else opaqueCount++;
    }

    console.log(`\n--- Alpha Analysis ---`);
    console.log(`Total pixels: ${totalPixels}`);
    console.log(`Fully transparent (a=0): ${transparentCount} (${(transparentCount / totalPixels * 100).toFixed(1)}%)`);
    console.log(`Semi-transparent: ${semiTransparentCount} (${(semiTransparentCount / totalPixels * 100).toFixed(1)}%)`);
    console.log(`Fully opaque (a=255): ${opaqueCount} (${(opaqueCount / totalPixels * 100).toFixed(1)}%)`);

    if (transparentCount > 0 && semiTransparentCount > 0) {
      console.log(`\nPASS: Output has both transparent and semi-transparent pixels.`);
    } else if (transparentCount > 0) {
      console.log(`\nPASS: Output has transparent pixels.`);
    } else {
      console.log(`\nWARN: No transparent pixels found - model may have failed to separate foreground.`);
    }
  } else {
    console.log(`\nFAIL: Output does not have an alpha channel.`);
  }

  console.log(`\nDone.`);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
