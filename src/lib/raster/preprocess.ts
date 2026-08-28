import "server-only";
import sharp from "sharp";
import { RASTER_LIMITS } from "./limits";
import type { RasterOptions } from "./types";
import { RasterConversionError } from "./errors";

export interface PreprocessResult {
  png: Buffer;
  width: number;
  height: number;
  hasAlpha: boolean;
}

/**
 * Decode the upload, enforce dimension/pixel budgets (downscaling when needed),
 * and apply the requested background. Returns a normalized PNG buffer that is
 * the exact raster the tracer will consume.
 */
export async function preprocessRaster(
  buffer: Buffer,
  options: RasterOptions,
  maxPixels: number,
): Promise<PreprocessResult> {
  const meta = await sharp(buffer, { animated: false }).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
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
  const pixels = width * height;
  if (pixels > maxPixels) {
    const scale = Math.sqrt(maxPixels / pixels);
    const targetW = Math.max(RASTER_LIMITS.MIN_DIMENSION, Math.round(width * scale));
    const targetH = Math.max(RASTER_LIMITS.MIN_DIMENSION, Math.round(height * scale));
    buffer = await sharp(buffer, { animated: false })
      .resize(targetW, targetH, { fit: "inside", withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
      .png()
      .toBuffer();
  }

  let pipeline = sharp(buffer, { animated: false });
  if (options.background === "custom" && options.bgColor) {
    pipeline = pipeline.flatten({ background: options.bgColor });
  }
  const png = await pipeline.png().toBuffer();
  const outMeta = await sharp(png).metadata();
  return {
    png,
    width: outMeta.width ?? width,
    height: outMeta.height ?? height,
    hasAlpha: outMeta.hasAlpha ?? false,
  };
}
