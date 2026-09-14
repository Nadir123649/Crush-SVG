import "server-only";
import sharp from "sharp";
import { BgRemoveError } from "./errors";
import type { BgRemoveResult } from "./types";
import type { BgRemoveOptionsParsed } from "./validation";
import { BG_REMOVE_LIMITS } from "./limits";

// Force Transformers.js to use WASM backend instead of native onnxruntime-node.
// onnxruntime-node's native binding (libonnxruntime.so.1) is missing on Vercel,
// and it's hardcoded as an external package by Next.js, so it can't be un-externalized.
const ORT_SYMBOL = Symbol.for("onnxruntime");

async function loadTransformers() {
  // Import WASM ort and register it as the global ONNX runtime
  // so @huggingface/transformers uses WASM instead of native
  const ort = await import("onnxruntime-web");
  if (!(ORT_SYMBOL in globalThis)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[ORT_SYMBOL] = ort;
  }

  return import("@huggingface/transformers");
}

// Configure Transformers.js for server-side use
// (loaded lazily via loadTransformers() to register WASM backend first)
const isVercel = !!process.env.VERCEL;

const MODEL_ID = "Xenova/modnet";

type RawImageResult = { width: number; height: number; data: Uint8Array };

// Accept file path strings, Buffer, Uint8Array, or Blob for WASM+Node compat
type PipelineInput = string | Buffer | Uint8Array | Blob;
let pipelinePromise: ((input: PipelineInput) => Promise<RawImageResult | RawImageResult[]>) | null = null;
let initError: Error | null = null;

async function getPipeline() {
  if (pipelinePromise) return pipelinePromise;
  if (initError) throw initError;

  const { pipeline, env } = await loadTransformers();

  // Configure env after loading — must happen after WASM backend is registered
  env.allowRemoteModels = true;
  env.allowLocalModels = true;
  // WASM backend doesn't have browser cache in Node.js serverless.
  // Use HTTP cache headers (CDN) instead — models are re-downloaded on cold starts.
  env.useFSCache = false;
  env.useBrowserCache = false;

  pipelinePromise = await pipeline("background-removal", MODEL_ID, {
    dtype: "fp32",
  }) as (input: PipelineInput) => Promise<RawImageResult | RawImageResult[]>;

  return pipelinePromise;
}

/**
 * Post-process the raw MODNet alpha mask for cleaner edges.
 * 1. Threshold: hard-cut near-zero and near-full alpha to reduce noise
 * 2. Blur: gaussian blur the mask for soft, natural edges
 */
async function postProcessMask(alpha: Uint8Array, w: number, h: number): Promise<Uint8Array> {
  // Step 1: Create a single-channel image from the alpha mask
  const maskImage = sharp(alpha, { raw: { width: w, height: h, channels: 1 } });

  // Step 2: Slight blur to smooth jagged edges (sigma=1.0 gives ~2px soft edge)
  const blurred = await maskImage
    .blur(1.0)
    .raw()
    .toBuffer();

  // Step 3: Re-threshold to clean up near-zero noise while keeping the soft edge
  const result = new Uint8Array(blurred.length);
  for (let i = 0; i < blurred.length; i++) {
    const v = blurred[i];
    // Hard-zero below 10, hard-full above 245, smooth in between
    if (v < 10) result[i] = 0;
    else if (v > 245) result[i] = 255;
    else result[i] = v;
  }
  return result;
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

  // Encode working image to PNG for model inference
  const workingPng = await sharp(workingPixels, {
    raw: { width: workingW, height: workingH, channels: 4 },
  })
    .png()
    .toBuffer();

  // Run MODNet inference — pass Buffer directly (works with both Node native and WASM backends)
  let bgRemovalPipeline;
  try {
    console.log("[modnet] Initializing pipeline, isVercel:", isVercel);
    bgRemovalPipeline = await getPipeline();
    console.log("[modnet] Pipeline ready");
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error));
    console.error("[modnet] Pipeline init FAILED:", initError.message);
    throw new BgRemoveError(
      "processing_failed",
      `Failed to initialize MODNet model: ${initError.message}`,
    );
  }

  let rawResult: RawImageResult | RawImageResult[] | null = null;
  try {
    console.log("[modnet] Running inference, input size:", workingPng.length, "bytes");
    // Convert PNG buffer to Blob — WASM backend can't read Node fs paths,
    // and the pipeline expects Blob/RawImage/string, not raw Buffer
    const blob = new Blob([workingPng], { type: "image/png" });
    rawResult = await bgRemovalPipeline(blob);
    console.log("[modnet] Inference complete");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[modnet] Inference FAILED:", msg);
    throw new BgRemoveError("processing_failed", `MODNet inference failed: ${msg}`);
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

  // Extract alpha mask, scaling back to original dimensions if downscaled
  let resizedAlpha: Uint8Array;
  if (resultWidth === origWidth && resultHeight === origHeight) {
    resizedAlpha = new Uint8Array(origWidth * origHeight);
    for (let i = 0; i < origWidth * origHeight; i++) {
      resizedAlpha[i] = resultData[i * 4 + 3];
    }
  } else {
    const singleChannel = await sharp(Buffer.from(resultData), {
      raw: { width: resultWidth, height: resultHeight, channels: 4 },
    })
      .extractChannel(3)
      .raw()
      .toBuffer();

    resizedAlpha = await sharp(singleChannel, {
      raw: { width: resultWidth, height: resultHeight, channels: 1 },
    })
      .resize(origWidth, origHeight, {
        fit: "fill",
        kernel: sharp.kernel.lanczos3,
      })
      .toColourspace("b-w")
      .raw()
      .toBuffer();
  }

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

  // Post-process: blur + threshold for clean, soft edges
  const cleanAlpha = await postProcessMask(resizedAlpha, origWidth, origHeight);

  // Write alpha mask directly into RGBA pixel data — avoids broken dest-in composite
  // (dest-in with a 1-channel grayscale overlay is treated as fully opaque by sharp)
  const maskedPixels = new Uint8Array(decoded.data);
  for (let i = 0; i < totalPixels; i++) {
    maskedPixels[i * 4 + 3] = cleanAlpha[i];
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
