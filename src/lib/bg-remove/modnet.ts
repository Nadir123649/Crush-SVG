import "server-only";
import dns from "node:dns";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { BgRemoveError } from "./errors";
import type { BgRemoveResult } from "./types";
import type { BgRemoveOptionsParsed } from "./validation";
import { BG_REMOVE_LIMITS } from "./limits";

const isVercel = !!process.env.VERCEL;

const MODEL_ID = "Xenova/modnet";

type RawImageResult = { width: number; height: number; data: Uint8Array };

// Accept file path strings, Buffer, Uint8Array, or Blob for WASM+Node compat
type PipelineInput = string | Buffer | Uint8Array | Blob;
type ModnetPipeline = (input: PipelineInput) => Promise<RawImageResult | RawImageResult[]>;

let pipelinePromise: ModnetPipeline | null = null;
let initInFlight: Promise<ModnetPipeline> | null = null;

/**
 * Bounded retry for transient model-load failures.
 *
 * The model is pulled from the Hugging Face Hub on every cold start (the FS
 * cache lives in the OS temp dir, which does not survive one), so a single DNS
 * hiccup such as
 * `getaddrinfo EAI_AGAIN huggingface.co` would otherwise fail the request.
 * Three attempts with a short backoff absorbs those blips without introducing
 * an unbounded loop.
 */
const MODEL_INIT_MAX_ATTEMPTS = 3;
const MODEL_INIT_RETRY_DELAY_MS = 500;

/**
 * Node's `fetch` reports transport failures as a bare `TypeError: fetch failed`
 * and puts the actionable detail on `error.cause` (e.g. `EAI_AGAIN`). Surface
 * that, otherwise the logs say nothing useful about why the load failed.
 */
function describeCause(error: unknown): string {
  const cause = (error as { cause?: unknown } | null)?.cause;
  if (!cause) return "";
  const code = (cause as { code?: string }).code;
  const message = (cause as Error).message;
  const detail = [code, message].filter(Boolean).join(": ");
  return detail ? ` (cause: ${detail})` : "";
}

/**
 * Reusable undici Agent with a custom lookup that uses dns.resolve4() instead
 * of libuv getaddrinfo. This avoids EAI_AGAIN failures observed when the OS
 * resolver is temporarily unreachable. The Agent is created once and shared
 * across all Hugging Face fetch calls within this module.
 *
 * The URL is never rewritten — TLS/SNI/certificate validation are unaffected.
 */
let hfAgent: import("undici").Agent | null = null;
function getHfAgent(): import("undici").Agent {
  if (hfAgent) return hfAgent;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Agent } = require("undici") as typeof import("undici");
  hfAgent = new Agent({
    connect: {
      lookup: (
        hostname: string,
        options: dns.LookupOptions,
        callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family: number) => void,
      ) => {
        dns.resolve4(hostname, (err, addresses) => {
          if (err) {
            // dns.resolve4 failed — propagate error; this agent only handles HF hosts,
            // so a dns.lookup fallback for the same host would not help.
            callback(err, "", 0);
            return;
          }
          if (options?.all) {
            return callback(null, addresses.map((a) => ({ address: a, family: 4 })), 4);
          }
          return callback(null, addresses[0], 4);
        });
      },
    },
  });
  return hfAgent;
}

/** Hostname set that should use the IPv4-forced agent. */
const HF_HOSTS = new Set(["huggingface.co", "hf.co"]);

async function loadPipelineWithRetry(): Promise<ModnetPipeline> {
  const { pipeline, env } = await import("@huggingface/transformers");

  // Configure env after loading
  env.allowRemoteModels = true;
  env.allowLocalModels = true;
  // The file-system cache MUST stay enabled. In Node, transformers.js (v4)
  // always requests the model *path* rather than its bytes
  // (`return_path = IS_NODE_ENV` in utils/model-loader.js) and skips reading
  // the download into memory, expecting it to be served back from the FS cache.
  // With both caches off, a successful download is discarded and the load dies
  // with "Unable to get model file path or buffer".
  // Serverless filesystems are read-only except for the OS temp dir, so cache
  // there; on warm invocations this also avoids re-downloading the ~26 MB model.
  env.useFSCache = true;
  env.cacheDir =
    process.env.TRANSFORMERS_CACHE_DIR || path.join(os.tmpdir(), "crushsvg-hf-cache");
  env.useBrowserCache = false;

  // Override env.fetch to route Hugging Face requests through the IPv4 agent,
  // bypassing the libuv getaddrinfo path that intermittently fails with EAI_AGAIN.
  // All other URLs are forwarded to the original fetch unchanged.
  const originalFetch = env.fetch;
  env.fetch = (input: Parameters<typeof originalFetch>[0], init?: Parameters<typeof originalFetch>[1]) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : String(input);
    let hostname: string;
    try {
      hostname = new URL(url).hostname;
    } catch {
      return originalFetch(input, init);
    }
    if (HF_HOSTS.has(hostname)) {
      return originalFetch(input, { ...init, dispatcher: getHfAgent() } as Parameters<typeof originalFetch>[1]);
    }
    return originalFetch(input, init);
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= MODEL_INIT_MAX_ATTEMPTS; attempt++) {
    try {
      return (await pipeline("background-removal", MODEL_ID, {
        dtype: "fp32",
      })) as ModnetPipeline;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[modnet] Model load attempt ${attempt}/${MODEL_INIT_MAX_ATTEMPTS} failed: ${message}${describeCause(error)}`,
      );
      if (attempt < MODEL_INIT_MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, MODEL_INIT_RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function getPipeline(): Promise<ModnetPipeline> {
  if (pipelinePromise) return pipelinePromise;

  // Single-flight: concurrent requests share one load rather than each pulling
  // the ~25.9 MB model. The in-flight promise is only ever held transiently —
  // a failure is NOT cached, so a later request is free to retry.
  const inFlight = initInFlight ?? (initInFlight = loadPipelineWithRetry());

  try {
    const loaded = await inFlight;
    pipelinePromise = loaded;
    return loaded;
  } catch (error) {
    pipelinePromise = null;
    throw error;
  } finally {
    if (initInFlight === inFlight) initInFlight = null;
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
    // getPipeline already retried transient load failures and did not cache
    // them, so reaching here means the retries were exhausted.
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[modnet] Pipeline init FAILED after retries: ${message}${describeCause(error)}`);
    // Server-side fault, not a bad request: report 503 and keep the internal
    // detail (file paths, library messages) in the logs rather than the response.
    throw new BgRemoveError(
      "model_unavailable",
      "The AI background remover is temporarily unavailable. Please try again in a moment.",
      503,
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

  // The pipeline normally returns RGBA (alpha = matte), but derive the channel
  // count from the data instead of assuming it, so a 1-channel mask or an RGB
  // result cannot be misread as alpha.
  const resultChannels = Math.round(resultData.length / (resultWidth * resultHeight));
  if (resultChannels !== 1 && resultChannels !== 4) {
    throw new BgRemoveError(
      "processing_failed",
      "MODNet returned an unexpected image format.",
      500,
    );
  }
  const alphaOffset = resultChannels === 4 ? 3 : 0;

  // Extract alpha mask, scaling back to original dimensions if downscaled
  let resizedAlpha: Uint8Array;
  if (resultWidth === origWidth && resultHeight === origHeight) {
    resizedAlpha = new Uint8Array(origWidth * origHeight);
    for (let i = 0; i < origWidth * origHeight; i++) {
      resizedAlpha[i] = resultData[i * resultChannels + alphaOffset];
    }
  } else {
    const singleChannel =
      resultChannels === 1
        ? Buffer.from(resultData)
        : await sharp(Buffer.from(resultData), {
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
  let maxAlpha = 0;
  for (let i = 0; i < resizedAlpha.length; i++) {
    const a = resizedAlpha[i];
    if (a > 20) foregroundCount++;
    if (a > maxAlpha) maxAlpha = a;
  }
  // Mask statistics make an "empty mask" report diagnosable from the logs: a
  // maxAlpha near 0 means the model itself found nothing (weak input for a
  // portrait-matting model), whereas a healthy maxAlpha with low coverage points
  // at the thresholding below.
  console.log(
    `[modnet] mask stats: input=${origWidth}x${origHeight} result=${resultWidth}x${resultHeight}x${resultChannels} ` +
      `maxAlpha=${maxAlpha} foreground=${((foregroundCount / totalPixels) * 100).toFixed(2)}%`,
  );
  if (foregroundCount / totalPixels < 0.01) {
    throw new BgRemoveError(
      "processing_failed",
      "MODNet detected no foreground subject in this image.",
    );
  }

  // Use the native soft AI mask directly
  const cleanAlpha = resizedAlpha;

  // Write alpha mask directly into RGBA pixel data — avoids broken dest-in composite
  // (dest-in with a 1-channel grayscale overlay is treated as fully opaque by sharp)
  // Written in place: the decoded buffer is not needed again, and a second
  // full-size RGBA copy is significant at the 20 MP pixel budget.
  const maskedPixels = decoded.data;
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
