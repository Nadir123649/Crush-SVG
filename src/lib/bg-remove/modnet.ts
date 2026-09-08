import "server-only";
import { pipeline, env } from "@huggingface/transformers";
import sharp from "sharp";
import { BgRemoveError } from "./errors";
import type { BgRemoveResult } from "./types";
import type { BgRemoveOptionsParsed } from "./validation";
import { BG_REMOVE_LIMITS } from "./limits";

// Configure Transformers.js for server-side use
env.allowRemoteModels = true;
env.allowLocalModels = true;
// v4 auto-detects FS and cache; force filesystem cache on server, disable browser cache
env.useFSCache = true;
env.useBrowserCache = false;

const MODEL_ID = "Xenova/modnet";
const WORKING_SIZE = 512;

type RawImageResult = { width: number; height: number; data: Uint8Array };

let pipelinePromise: ((input: string) => Promise<RawImageResult | RawImageResult[]>) | null = null;
let initError: Error | null = null;

async function getPipeline() {
  if (pipelinePromise) return pipelinePromise;
  if (initError) throw initError;

  pipelinePromise = await pipeline("background-removal", MODEL_ID, {
    dtype: "fp32",
  }) as (input: string) => Promise<RawImageResult | RawImageResult[]>;

  return pipelinePromise;
}

/**
 * Write a buffer to a temporary file and return the path.
 * The caller is responsible for cleaning up the file.
 */
async function writeTempPng(buffer: Buffer): Promise<string> {
  const { writeFile, mkdir } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const tmpDir = join(tmpdir(), "crushsvg-bg-remove");
  await mkdir(tmpDir, { recursive: true });
  const tmpPath = join(tmpDir, `input-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  await writeFile(tmpPath, buffer);
  return tmpPath;
}

async function cleanupTempFile(path: string): Promise<void> {
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(path);
  } catch {
    // best-effort cleanup
  }
}

export async function processWithModnet(
  buffer: Buffer,
  options: BgRemoveOptionsParsed,
): Promise<BgRemoveResult> {
  // Single decode — get metadata and raw pixels in one pass
  const decoded = await sharp(buffer, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const origWidth = decoded.info.width;
  const origHeight = decoded.info.height;

  if (!origWidth || !origHeight) {
    throw new BgRemoveError("invalid_image", "Could not read image dimensions.");
  }
  if (origWidth < BG_REMOVE_LIMITS.MIN_DIMENSION || origHeight < BG_REMOVE_LIMITS.MIN_DIMENSION) {
    throw new BgRemoveError("unsupported_dimensions", "Image is too small to process.");
  }
  if (origWidth > BG_REMOVE_LIMITS.MAX_DIMENSION || origHeight > BG_REMOVE_LIMITS.MAX_DIMENSION) {
    throw new BgRemoveError(
      "unsupported_dimensions",
      `Image dimension exceeds the ${BG_REMOVE_LIMITS.MAX_DIMENSION}px limit.`,
    );
  }

  // Downscale if over pixel budget — operate on raw pixels directly
  let workingPixels = decoded.data;
  let workingW = origWidth;
  let workingH = origHeight;
  const pixels = origWidth * origHeight;
  if (pixels > BG_REMOVE_LIMITS.MAX_PIXELS) {
    const scale = Math.sqrt(BG_REMOVE_LIMITS.MAX_PIXELS / pixels);
    const targetW = Math.max(BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(origWidth * scale));
    const targetH = Math.max(BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(origHeight * scale));
    const resized = await sharp(decoded.data, { raw: { width: origWidth, height: origHeight, channels: 4 } })
      .resize(targetW, targetH, {
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();
    // Decode resized PNG back to raw for the padding step
    const resizedDecoded = await sharp(resized).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    workingPixels = resizedDecoded.data;
    workingW = resizedDecoded.info.width;
    workingH = resizedDecoded.info.height;
  }

  // Pad to square for model input (MODNet expects square input)
  const padded = await sharp(workingPixels, { raw: { width: workingW, height: workingH, channels: 4 } })
    .ensureAlpha()
    .resize(WORKING_SIZE, WORKING_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  // Run MODNet inference
  let bgRemovalPipeline;
  try {
    bgRemovalPipeline = await getPipeline();
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    throw new BgRemoveError(
      "processing_failed",
      `Failed to initialize MODNet model: ${initError.message}`,
    );
  }

  let rawResult: RawImageResult | RawImageResult[] | null = null;
  let tmpPath: string | null = null;
  try {
    tmpPath = await writeTempPng(padded);
    rawResult = await bgRemovalPipeline(tmpPath);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new BgRemoveError("processing_failed", `MODNet inference failed: ${msg}`);
  } finally {
    if (tmpPath) await cleanupTempFile(tmpPath);
  }

  if (!rawResult) {
    throw new BgRemoveError("processing_failed", "MODNet returned no result.");
  }

  // transformers.js v4 may return an array of RawImage or a single RawImage
  const resultImage: RawImageResult = Array.isArray(rawResult) ? rawResult[0] : rawResult;

  if (!resultImage) {
    throw new BgRemoveError("processing_failed", "MODNet returned an empty result set.");
  }

  const resultWidth = resultImage.width;
  const resultHeight = resultImage.height;
  const resultData = resultImage.data;

  if (!resultData || !resultWidth || !resultHeight) {
    throw new BgRemoveError("processing_failed", "MODNet returned invalid image data.");
  }

  // Extract alpha channel from MODNet result — single sharp pipeline
  const alphaChannel = await sharp(Buffer.from(resultData), {
    raw: { width: resultWidth, height: resultHeight, channels: 4 },
  })
    .extractChannel(3) // alpha channel
    .raw()
    .toBuffer();

  // Compute content region (undo padding)
  const contentAspect = origWidth / origHeight;
  let contentW: number;
  let contentH: number;
  let padX: number;
  let padY: number;

if (contentAspect >= 1) {
        contentH = resultHeight;
        contentW = Math.round(resultHeight * contentAspect);
        if (contentW > resultWidth) {
            contentW = resultWidth;
            contentH = Math.round(resultWidth / contentAspect);
        }
        padX = Math.floor((resultWidth - contentW) / 2);
        padY = Math.floor((resultHeight - contentH) / 2);
    } else {
        contentW = resultWidth;
        contentH = Math.round(resultWidth / contentAspect);
        if (contentH > resultHeight) {
            contentH = resultHeight;
            contentW = Math.round(resultHeight * contentAspect);
        }
        padX = Math.floor((resultWidth - contentW) / 2);
        padY = Math.floor((resultHeight - contentH) / 2);
    }

  contentW = Math.min(contentW, resultWidth - padX);
  contentH = Math.min(contentH, resultHeight - padY);

  // Resize alpha mask to original dimensions — raw single-channel buffer.
  // .toColourspace("b-w") is required: Sharp's .raw() silently upscales
  // 1-channel images to 3-channel RGB after pipeline operations like resize(),
  // which would cause a 3× buffer overrun and scanline corruption.
  const resizedAlpha = await sharp(alphaChannel, {
    raw: { width: resultWidth, height: resultHeight, channels: 1 },
  })
    .extract({ left: padX, top: padY, width: contentW, height: contentH })
    .resize(origWidth, origHeight, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .toColourspace("b-w")
    .raw()
    .toBuffer();

  const totalPixels = origWidth * origHeight;
  let foregroundCount = 0;
  for (let i = 0; i < resizedAlpha.length; i++) {
    if (resizedAlpha[i] > 20) foregroundCount++;
  }
  if (foregroundCount / totalPixels < 0.01) {
    throw new BgRemoveError(
      "processing_failed",
      "MODNet detected no foreground subject in this image.",
    );
  }

  // Write alpha mask directly into RGBA pixel data — avoids broken dest-in composite
  // (dest-in with a 1-channel grayscale overlay is treated as fully opaque by sharp)
  const maskedPixels = new Uint8Array(decoded.data);
  for (let i = 0; i < totalPixels; i++) {
    maskedPixels[i * 4 + 3] = resizedAlpha[i];
  }

  let composited: Buffer;

  switch (options.bgOption) {
    case "Transparent": {
      composited = await sharp(maskedPixels, { raw: { width: origWidth, height: origHeight, channels: 4 } })
        .png({ compressionLevel: 3, adaptiveFiltering: true })
        .toBuffer();
      break;
    }
    case "White":
    case "Black":
    case "Custom": {
      const targetHex =
        options.bgOption === "White"
          ? "#FFFFFF"
          : options.bgOption === "Black"
            ? "#000000"
            : options.bgColor ?? "#FFFFFF";
      const r = parseInt(targetHex.slice(1, 3), 16);
      const g = parseInt(targetHex.slice(3, 5), 16);
      const b = parseInt(targetHex.slice(5, 7), 16);

      // Create solid RGBA background, composite masked foreground over it
      const bgImage = sharp({
        create: {
          width: origWidth,
          height: origHeight,
          channels: 4,
          background: { r, g, b, alpha: 255 },
        },
      });

      composited = await bgImage
        .composite([{ input: Buffer.from(maskedPixels), raw: { width: origWidth, height: origHeight, channels: 4 }, blend: "over" }])
        .png({ compressionLevel: 3, adaptiveFiltering: true })
        .toBuffer();
      break;
    }
    default: {
      composited = await sharp(maskedPixels, { raw: { width: origWidth, height: origHeight, channels: 4 } })
        .png({ compressionLevel: 3, adaptiveFiltering: true })
        .toBuffer();
    }
  }

  // Apply scale — single sharp pipeline, no intermediate PNG encode
  let finalBuffer = composited;
  let finalWidth = origWidth;
  let finalHeight = origHeight;
  const scaleVal = typeof options.scale === "number" && !isNaN(options.scale) && options.scale > 0 ? options.scale : 100;
  const scaleFactor = scaleVal / 100;
  if (scaleFactor !== 1) {
    finalWidth = Math.max(1, Math.round(origWidth * scaleFactor));
    finalHeight = Math.max(1, Math.round(origHeight * scaleFactor));
    finalBuffer = await sharp(composited)
      .resize(finalWidth, finalHeight, {
        fit: "inside",
        kernel: sharp.kernel.lanczos3,
      })
      .png({ compressionLevel: 3, adaptiveFiltering: true })
      .toBuffer();
  }

  return {
    buffer: finalBuffer,
    format: "png",
    size: finalBuffer.length,
    width: finalWidth,
    height: finalHeight,
  };
}
