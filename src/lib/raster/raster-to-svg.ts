import "server-only";
import sharp from "sharp";
import { RASTER_LIMITS, isAcceptedImage } from "./limits";
import { rasterOptionsSchema } from "./validation";
import { RasterConversionError } from "./errors";
import { preprocessRaster } from "./preprocess";
import { analyzeImage, resolveImageClass } from "./analyze";
import { buildVtracerOptions, traceRaster, countSvgColors } from "./trace";
import { optimizeSvg } from "./optimize";
import { injectMetadata } from "./build-svg";
import { validateRasterOutput } from "./validate-output";
import type { RasterOptions, RasterResult } from "./types";

export const CONVERSION_TIMEOUT_MS_INLINE = RASTER_LIMITS.TIMEOUT_MS_INLINE;
export const CONVERSION_TIMEOUT_MS_QUEUED = RASTER_LIMITS.TIMEOUT_MS_QUEUED;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new RasterConversionError("vectorization_timed_out", message, 504));
    }, ms);
    Promise.resolve(promise).then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export interface RasterContext {
  isQueued?: boolean;
}

export async function rasterToSvg(
  buffer: Buffer,
  options: RasterOptions,
  ctx: RasterContext = {},
): Promise<RasterResult> {
  if (!isAcceptedImage(buffer)) {
    throw new RasterConversionError(
      "invalid_image",
      "Unsupported image. Use PNG, JPEG, GIF, or BMP.",
    );
  }
  if (buffer.length > RASTER_LIMITS.MAX_UPLOAD_BYTES) {
    throw new RasterConversionError(
      "image_too_large",
      `Upload exceeds the ${Math.round(RASTER_LIMITS.MAX_UPLOAD_BYTES / 1024 / 1024)}MB limit.`,
    );
  }

  const maxPixels = ctx.isQueued ? RASTER_LIMITS.MAX_PIXELS_QUEUED : RASTER_LIMITS.MAX_PIXELS_INLINE;
  const prepared = await preprocessRaster(buffer, options, maxPixels);
  const analysis = await analyzeImage(prepared.png, prepared.hasAlpha);
  const imageClass = resolveImageClass(options.mode, analysis);
  const vtOptions = buildVtracerOptions(imageClass, options, prepared.hasAlpha);

  const rawSvg = await withTimeout(
    Promise.resolve(traceRaster(prepared.png, vtOptions)),
    ctx.isQueued ? CONVERSION_TIMEOUT_MS_QUEUED : CONVERSION_TIMEOUT_MS_INLINE,
    "Vectorization exceeded the time budget.",
  );

  const optimized = optimizeSvg(rawSvg);
  const withMeta = injectMetadata(optimized, {
    width: prepared.width,
    height: prepared.height,
    imageClass,
    options,
  });
  const { svg, width, height } = validateRasterOutput(withMeta);

  const advisory =
    imageClass === "photo"
      ? "Photos vectorize as stylized posterized artwork, not as a 1:1 edit-friendly illustration. For pixel-perfect fidelity, keep the original raster."
      : undefined;

  return {
    svg,
    width,
    height,
    imageClass,
    colorCount: countSvgColors(svg),
    size: svg.length,
    advisory,
  };
}

/** Quick heuristic: should this job go to the (optional) worker queue? */
export async function recommendQueue(buffer: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(buffer, { animated: false }).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) return false;
    return w * h > RASTER_LIMITS.MAX_PIXELS_INLINE || buffer.length > 3 * 1024 * 1024;
  } catch {
    return false;
  }
}

export { rasterOptionsSchema };
