import "server-only";
import sharp from "sharp";
import { RASTER_LIMITS } from "./limits";
import type { RasterOptions } from "./types";
import { RasterConversionError } from "./errors";
import { processBackgroundRemove } from "@/lib/bg-remove/process";

export interface PreprocessResult {
  png: Buffer;
  width: number;
  height: number;
  hasAlpha: boolean;
  rawPixels?: Buffer | Uint8Array;
}

/**
 * Decode the upload, enforce dimension/pixel budgets (downscaling when needed),
 * and apply the requested background using the canonical background remover engine.
 * Returns a normalized PNG buffer that is the exact raster the tracer will consume.
 */
export async function preprocessRaster(
  buffer: Buffer,
  options: RasterOptions,
  maxPixels: number,
): Promise<PreprocessResult> {
  let workingBuffer = buffer;

  // Check image metadata before running expensive operations
  const meta = await sharp(buffer, { animated: false }).metadata();

  // Run canonical background remover engine only if transparent background is requested
  // and the source image does not already have an alpha channel
  if (options.background === "transparent" && !meta.hasAlpha) {
    try {
      const bgResult = await processBackgroundRemove(buffer, {
        bgOption: "Transparent",
        scale: 100,
      });
      workingBuffer = bgResult.buffer;
    } catch {
      /* Fallback to original buffer */
    }
  }

  // Single decode — get metadata and raw pixels in one pass
  const decoded = await sharp(workingBuffer, { animated: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let width = decoded.info.width;
  let height = decoded.info.height;
  let pixels = decoded.data;

  if (!width || !height) {
    throw new RasterConversionError("invalid_image", "Could not read image dimensions.");
  }
  if (width < RASTER_LIMITS.MIN_DIMENSION || height < RASTER_LIMITS.MIN_DIMENSION) {
    throw new RasterConversionError("unsupported_dimensions", "Image is too small to vectorize.");
  }
  if (width > RASTER_LIMITS.MAX_DIMENSION || height > RASTER_LIMITS.MAX_DIMENSION) {
    throw new RasterConversionError(
      "unsupported_dimensions",
      `Image dimension exceeds the ${RASTER_LIMITS.MAX_DIMENSION}px limit.`,
    );
  }

  const totalPixels = width * height;
  if (totalPixels > maxPixels) {
    const scale = Math.sqrt(maxPixels / totalPixels);
    const targetW = Math.max(RASTER_LIMITS.MIN_DIMENSION, Math.round(width * scale));
    const targetH = Math.max(RASTER_LIMITS.MIN_DIMENSION, Math.round(height * scale));
    const resized = await sharp(decoded.data, { raw: { width, height, channels: 4 } })
      .resize(targetW, targetH, { fit: "inside", withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    pixels = resized.data;
    width = resized.info.width;
    height = resized.info.height;
  }

  let pipeline = sharp(pixels, { raw: { width, height, channels: 4 } });
  let hasAlpha = true;

  if (options.background === "custom" && options.bgColor) {
    pipeline = pipeline.flatten({ background: options.bgColor });
    hasAlpha = false;
  }

  // Single PNG encode at the end — no intermediate encodes, no metadata re-read
  const png = await pipeline.png().toBuffer();

  return {
    png,
    width,
    height,
    hasAlpha,
    rawPixels: pixels,
  };
}
