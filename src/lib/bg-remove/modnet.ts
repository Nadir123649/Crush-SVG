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
env.useFS = true;
env.useBrowserCache = false;

const MODEL_ID = "Xenova/modnet";
const WORKING_SIZE = 512;

type BackgroundRemovalPipeline = {
  (input: string): Promise<{ width: number; height: number; data: Uint8Array }>;
};

let pipelinePromise: BackgroundRemovalPipeline | null = null;
let initError: Error | null = null;

async function getPipeline(): Promise<BackgroundRemovalPipeline> {
  if (pipelinePromise) return pipelinePromise;
  if (initError) throw initError;

  pipelinePromise = (await pipeline(
    "background-removal",
    MODEL_ID,
    {
      device: "cpu",
      dtype: "fp32",
    },
  )) as unknown as BackgroundRemovalPipeline;

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
  const meta = await sharp(buffer, { animated: false }).metadata();
  const origWidth = meta.width ?? 0;
  const origHeight = meta.height ?? 0;

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

  const pixels = origWidth * origHeight;
  if (pixels > BG_REMOVE_LIMITS.MAX_PIXELS) {
    const scale = Math.sqrt(BG_REMOVE_LIMITS.MAX_PIXELS / pixels);
    const targetW = Math.max(BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(origWidth * scale));
    const targetH = Math.max(BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(origHeight * scale));
    buffer = await sharp(buffer, { animated: false })
      .resize(targetW, targetH, {
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();
  }

  // Pad to square for model input (MODNet expects square input)
  const padded = await sharp(buffer, { animated: false })
    .ensureAlpha()
    .resize(WORKING_SIZE, WORKING_SIZE, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  // Run MODNet inference
  let bgRemovalPipeline: BackgroundRemovalPipeline;
  try {
    bgRemovalPipeline = await getPipeline();
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    throw new BgRemoveError(
      "processing_failed",
      `Failed to initialize MODNet model: ${initError.message}`,
    );
  }

  let resultImage: { width: number; height: number; data: Uint8Array } | null = null;
  let tmpPath: string | null = null;
  try {
    tmpPath = await writeTempPng(padded);
    resultImage = await bgRemovalPipeline(tmpPath);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new BgRemoveError("processing_failed", `MODNet inference failed: ${msg}`);
  } finally {
    if (tmpPath) await cleanupTempFile(tmpPath);
  }

  if (!resultImage) {
    throw new BgRemoveError("processing_failed", "MODNet returned no result.");
  }

  // resultImage is a RawImage with alpha channel applied
  // Extract the RGBA data
  const resultWidth = resultImage.width;
  const resultHeight = resultImage.height;
  const resultData = resultImage.data;

  if (!resultData || !resultWidth || !resultHeight) {
    throw new BgRemoveError("processing_failed", "MODNet returned invalid image data.");
  }

  // Extract the alpha channel from the result
  const resultBuf = Buffer.from(resultData);
  const resultSharp = sharp(resultBuf, {
    raw: { width: resultWidth, height: resultHeight, channels: 4 },
  });

  // Extract alpha from the MODNet result
  const alphaChannel = await resultSharp
    .extractChannel(3) // alpha channel
    .raw()
    .toBuffer();

  // Crop the content area out of the padded 512×512 alpha.
  // fit:"contain" centers the image inside the square, so we compute the
  // content rectangle and extract it before resizing to original dimensions.
  const contentAspect = origWidth / origHeight;
  let contentW: number;
  let contentH: number;
  let padX: number;
  let padY: number;

  if (contentAspect >= 1) {
    // wider or square – height is the limiting dimension
    contentH = resultHeight;
    contentW = Math.round(resultHeight * contentAspect);
    // contentW can exceed resultWidth when aspect > 1 after contain; clamp
    if (contentW > resultWidth) {
      contentW = resultWidth;
      contentH = Math.round(resultWidth / contentAspect);
    }
    padX = Math.round((resultWidth - contentW) / 2);
    padY = Math.round((resultHeight - contentH) / 2);
  } else {
    // taller – width is the limiting dimension
    contentW = resultWidth;
    contentH = Math.round(resultWidth / contentAspect);
    if (contentH > resultHeight) {
      contentH = resultHeight;
      contentW = Math.round(resultHeight * contentAspect);
    }
    padX = Math.round((resultWidth - contentW) / 2);
    padY = Math.round((resultHeight - contentH) / 2);
  }

  // Clamp to valid bounds (safety for rounding)
  contentW = Math.min(contentW, resultWidth - padX);
  contentH = Math.min(contentH, resultHeight - padY);

  // Crop content area, then resize to original dimensions.
  // .toColourspace('b-w') is required: Sharp's .raw() silently upscales
  // 1-channel images to 3-channel RGB after pipeline operations like
  // resize(), which would cause a 3× buffer overrun and scanline corruption.
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

  // Get original image as raw RGBA
  const originalRaw = await sharp(buffer, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Combine original RGB with MODNet alpha
  const combined = new Uint8ClampedArray(origWidth * origHeight * 4);
  for (let i = 0; i < origWidth * origHeight; i++) {
    const srcIdx = i * 4;
    const dstIdx = i * 4;
    combined[dstIdx] = originalRaw.data[srcIdx];       // R
    combined[dstIdx + 1] = originalRaw.data[srcIdx + 1]; // G
    combined[dstIdx + 2] = originalRaw.data[srcIdx + 2]; // B
    combined[dstIdx + 3] = resizedAlpha[i];              // A from MODNet
  }

  // Handle bgOption
  let outputBuffer: Buffer;
  switch (options.bgOption) {
    case "Transparent":
      outputBuffer = await sharp(Buffer.from(combined), {
        raw: { width: origWidth, height: origHeight, channels: 4 },
      })
        .png()
        .toBuffer();
      break;
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

      // Composite the foreground over the target background color
      const fgImage = sharp(Buffer.from(combined), {
        raw: { width: origWidth, height: origHeight, channels: 4 },
      });
      const bgImage = sharp({
        create: {
          width: origWidth,
          height: origHeight,
          channels: 3,
          background: { r, g, b },
        },
      });
      outputBuffer = await fgImage
        .composite([{ input: await bgImage.png().toBuffer(), blend: "over" }])
        .png()
        .toBuffer();
      break;
    }
    default:
      outputBuffer = await sharp(Buffer.from(combined), {
        raw: { width: origWidth, height: origHeight, channels: 4 },
      })
        .png()
        .toBuffer();
  }

  // Apply scale
  const scaleFactor = options.scale / 100;
  let finalBuffer = outputBuffer;
  let finalWidth = origWidth;
  let finalHeight = origHeight;
  if (scaleFactor !== 1) {
    finalWidth = Math.max(1, Math.round(origWidth * scaleFactor));
    finalHeight = Math.max(1, Math.round(origHeight * scaleFactor));
    finalBuffer = await sharp(outputBuffer)
      .resize(finalWidth, finalHeight, {
        fit: "inside",
        kernel: sharp.kernel.lanczos3,
      })
      .png()
      .toBuffer();
  }

  const dataUrl = `data:image/png;base64,${finalBuffer.toString("base64")}`;
  const outMeta = await sharp(finalBuffer).metadata();

  return {
    dataUrl,
    format: "png",
    size: finalBuffer.length,
    width: outMeta.width ?? finalWidth,
    height: outMeta.height ?? finalHeight,
  };
}
