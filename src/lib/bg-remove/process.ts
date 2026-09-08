import "server-only";
import sharp from "sharp";
import { BG_REMOVE_LIMITS } from "./limits";
import { detectBackgroundColor } from "./detect";
import { removeBackground, replaceBackgroundWithColor } from "./remove";
import { BgRemoveError } from "./errors";
import type { BgRemoveResult } from "./types";
import type { BgRemoveOptionsParsed } from "./validation";
import { shouldUseModnetEngine } from "./feature-flag";
import { classifyImage } from "./classify";

let modnetProcessor: typeof import("./modnet").processWithModnet | null = null;

async function getModnetProcessor() {
  if (!modnetProcessor) {
    const modnet = await import("./modnet");
    modnetProcessor = modnet.processWithModnet;
  }
  return modnetProcessor;
}

/**
 * Full background-removal pipeline: decode → classify → route → process → encode.
 *
 * Routing logic:
 * - BG_REMOVE_USE_MODNET=false → always legacy
 * - BG_REMOVE_USE_MODNET=true (default) → classifier decides per image:
 *   - "photo" → MODNet (photographic subjects, portraits)
 *   - "graphic" → legacy (logos, text, flat artwork)
 *
 * The classifier is cheap (pixel statistics only) and runs before the
 * expensive model inference, so it adds negligible overhead.
 */
export async function processBackgroundRemove(
  buffer: Buffer,
  options: BgRemoveOptionsParsed,
): Promise<BgRemoveResult> {
  if (!shouldUseModnetEngine()) {
    return processLegacy(buffer, options);
  }

  // Decode to raw pixels ONCE — reuse for both classification and downstream processing
  const decoded = await sharp(buffer, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rawData = new Uint8ClampedArray(
    decoded.data.buffer,
    decoded.data.byteOffset,
    decoded.data.byteLength,
  );
  const w = decoded.info.width;
  const h = decoded.info.height;

  const bg = detectBackgroundColor(rawData, w, h);
  if (bg.isTransparent) {
    return processLegacyFromRaw(rawData, w, h, options);
  }

  const classification = classifyImage(rawData, w, h);

  if (classification === "photo") {
    try {
      const processModnet = await getModnetProcessor();
      return await processModnet(buffer, options);
    } catch {
      // MODNet failed — fall back to legacy color-distance engine
      return processLegacyFromRaw(rawData, w, h, options);
    }
  }

  // graphic → legacy engine (reuse already-decoded pixels)
  return processLegacyFromRaw(rawData, w, h, options);
}

/**
 * Legacy path that accepts pre-decoded raw RGBA pixels (avoids redundant sharp decode).
 */
async function processLegacyFromRaw(
  rawData: Uint8ClampedArray,
  w: number,
  h: number,
  options: BgRemoveOptionsParsed,
): Promise<BgRemoveResult> {
  if (w < BG_REMOVE_LIMITS.MIN_DIMENSION || h < BG_REMOVE_LIMITS.MIN_DIMENSION) {
    throw new BgRemoveError("unsupported_dimensions", "Image is too small to process.");
  }
  if (w > BG_REMOVE_LIMITS.MAX_DIMENSION || h > BG_REMOVE_LIMITS.MAX_DIMENSION) {
    throw new BgRemoveError(
      "unsupported_dimensions",
      `Image dimension exceeds the ${BG_REMOVE_LIMITS.MAX_DIMENSION}px limit.`,
    );
  }

  const bg = detectBackgroundColor(rawData, w, h);

  let resultPixels: Uint8ClampedArray;

  switch (options.bgOption) {
    case "Transparent":
      resultPixels = removeBackground(rawData, w, h, bg);
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
      resultPixels = replaceBackgroundWithColor(rawData, w, h, bg, targetHex);
      break;
    }
    default:
      resultPixels = rawData;
  }

  let outputPipeline = sharp(resultPixels, {
    raw: { width: w, height: h, channels: 4 },
  });

  const scaleFactor = options.scale / 100;
  let finalW = w;
  let finalH = h;
  if (scaleFactor !== 1) {
    finalW = Math.max(1, Math.round(w * scaleFactor));
    finalH = Math.max(1, Math.round(h * scaleFactor));
    outputPipeline = outputPipeline.resize(finalW, finalH, {
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    });
  }

  // Single PNG encode at the end — no intermediate encodes
  const outputMeta = await outputPipeline
    .png({ compressionLevel: 3, adaptiveFiltering: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: outputMeta.data,
    format: "png",
    size: outputMeta.data.length,
    width: outputMeta.info.width ?? finalW,
    height: outputMeta.info.height ?? finalH,
  };
}

/**
 * Legacy color-distance background removal.
 */
async function processLegacy(
  buffer: Buffer,
  options: BgRemoveOptionsParsed,
): Promise<BgRemoveResult> {
  const meta = await sharp(buffer, { animated: false }).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  if (!width || !height) {
    throw new BgRemoveError("invalid_image", "Could not read image dimensions.");
  }
  if (width < BG_REMOVE_LIMITS.MIN_DIMENSION || height < BG_REMOVE_LIMITS.MIN_DIMENSION) {
    throw new BgRemoveError("unsupported_dimensions", "Image is too small to process.");
  }
  if (width > BG_REMOVE_LIMITS.MAX_DIMENSION || height > BG_REMOVE_LIMITS.MAX_DIMENSION) {
    throw new BgRemoveError(
      "unsupported_dimensions",
      `Image dimension exceeds the ${BG_REMOVE_LIMITS.MAX_DIMENSION}px limit.`,
    );
  }

  // Resize if over pixel budget
  let workingBuffer = buffer;
  let w = width;
  let h = height;
  const pixels = width * height;
  if (pixels > BG_REMOVE_LIMITS.MAX_PIXELS) {
    const scale = Math.sqrt(BG_REMOVE_LIMITS.MAX_PIXELS / pixels);
    const targetW = Math.max(BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(width * scale));
    const targetH = Math.max(BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(height * scale));
    const resized = await sharp(buffer, { animated: false })
      .resize(targetW, targetH, {
        fit: "inside",
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    workingBuffer = resized.data as unknown as Buffer;
    w = resized.info.width;
    h = resized.info.height;
  }

  // Decode once — single sharp pipeline
  const decoded = await sharp(workingBuffer, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rawData = new Uint8ClampedArray(
    decoded.data.buffer,
    decoded.data.byteOffset,
    decoded.data.byteLength,
  );

  const bg = detectBackgroundColor(rawData, w, h);

  let resultPixels: Uint8ClampedArray;

  switch (options.bgOption) {
    case "Transparent":
      resultPixels = removeBackground(rawData, w, h, bg);
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
      resultPixels = replaceBackgroundWithColor(rawData, w, h, bg, targetHex);
      break;
    }
    default:
      resultPixels = rawData;
  }

  let outputPipeline = sharp(resultPixels, {
    raw: { width: w, height: h, channels: 4 },
  });

  const scaleFactor = options.scale / 100;
  let finalW = w;
  let finalH = h;
  if (scaleFactor !== 1) {
    finalW = Math.max(1, Math.round(w * scaleFactor));
    finalH = Math.max(1, Math.round(h * scaleFactor));
    outputPipeline = outputPipeline.resize(finalW, finalH, {
      fit: "inside",
      kernel: sharp.kernel.lanczos3,
    });
  }

  // Single PNG encode at the end — no intermediate encodes, no unnecessary metadata decode
  const outputMeta = await outputPipeline
    .png({ compressionLevel: 3, adaptiveFiltering: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: outputMeta.data,
    format: "png",
    size: outputMeta.data.length,
    width: outputMeta.info.width ?? finalW,
    height: outputMeta.info.height ?? finalH,
  };
}
