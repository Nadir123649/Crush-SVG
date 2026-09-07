import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { logConversion } from "@/lib/usage/conversion-logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { ensureGuestId, getGuestUsage, incrementGuestUsage, GUEST_CONVERSION_LIMIT } from "@/lib/usage/guest-usage";
import { auth } from "@/lib/middleware/auth-middleware";
import { classifyRasterError, RasterConversionError } from "@/lib/raster/errors";
import { rasterOptionsSchema } from "@/lib/raster/validation";
import { rasterToSvg } from "@/lib/raster/raster-to-svg";
import type { RasterOptions } from "@/lib/raster/types";
import { processBackgroundRemove } from "@/lib/bg-remove/process";
import { classifyBgRemoveError, BgRemoveError } from "@/lib/bg-remove/errors";
import { z } from "zod";

async function preprocessBackground(
  buffer: Buffer,
  options: RasterOptions,
): Promise<Buffer> {
  if (options.background === "preserve") return buffer;
  if (options.background === "custom" && !options.bgColor) return buffer;

  const bgOption: "Transparent" | "Custom" =
    options.background === "transparent" ? "Transparent" : "Custom";

  const result = await processBackgroundRemove(buffer, {
    scale: 100,
    bgOption,
    ...(bgOption === "Custom" && options.bgColor ? { bgColor: options.bgColor } : {}),
  });

  const commaIdx = result.dataUrl.indexOf(",");
  if (commaIdx < 0) {
    throw new BgRemoveError("processing_failed", "Background removal produced an invalid data URL.");
  }
  return Buffer.from(result.dataUrl.slice(commaIdx + 1), "base64");
}

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

async function getUsage(request: NextRequest) {
  const guestId = ensureGuestId(request).guestId ?? crypto.randomUUID();
  try {
    const used = Math.min(await getGuestUsage(guestId), GUEST_CONVERSION_LIMIT);
    return { guestId, maxConversions: GUEST_CONVERSION_LIMIT, used, remaining: Math.max(GUEST_CONVERSION_LIMIT - used, 0) };
  } catch {
    return { guestId, maxConversions: GUEST_CONVERSION_LIMIT, used: 0, remaining: GUEST_CONVERSION_LIMIT };
  }
}

async function enforceGuestLimit(request: NextRequest, userId: string | null): Promise<NextResponse | { guestId: string; maxConversions: number; used: number; remaining: number }> {
  if (userId) return getUsage(request);
  const usage = await getUsage(request);
  if (usage.remaining <= 0) {
    return errorResponse(
      429,
      "guest_limit_reached",
      "Daily guest conversion limit reached. Sign in or try again tomorrow.",
      undefined,
      request,
    );
  }
  return usage;
}

async function incrementUsage(guestId: string) {
  try {
    await incrementGuestUsage(guestId);
  } catch {
    /* non-fatal */
  }
}

export async function POST(request: NextRequest) {
  try {
    const rate = await checkRateLimit(request, "vectorize", RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      return errorResponse(429, "rate_limited", "Too many requests. Slow down and retry.", undefined, request);
    }

    const who = await auth(request);
    const userId = "user" in who ? who.user.id : null;
    const limitOrResponse = await enforceGuestLimit(request, userId);
    if (limitOrResponse instanceof NextResponse) return limitOrResponse;
    const limit = limitOrResponse;

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return errorResponse(400, "missing_file", "No image file provided.", undefined, request);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return errorResponse(400, "file_too_large", "Image exceeds the 12MB upload limit.", undefined, request);
    }

    const options = rasterOptionsSchema.parse({
      mode: form.get("mode") ?? undefined,
      quality: form.get("quality") ?? undefined,
      colorCount: form.get("colorCount") ?? undefined,
      background: form.get("background") ?? undefined,
      bgColor: form.get("bgColor") ?? undefined,
    }) as RasterOptions;

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalSize = file.size;

    let processedBuffer: Buffer;
    try {
      processedBuffer = await preprocessBackground(buffer, options);
    } catch (bgError) {
      if (bgError instanceof BgRemoveError) {
        await logConversionError(request, bgError);
        return errorResponse(bgError.status, bgError.code, bgError.message, undefined, request);
      }
      const failure = classifyBgRemoveError(bgError);
      const err = new BgRemoveError(failure.code, failure.message, failure.status);
      await logConversionError(request, err);
      return errorResponse(failure.status, failure.code, failure.message, undefined, request);
    }

    const result = await rasterToSvg(processedBuffer, options);

    await logConversion({
      userId,
      guestId: limit.guestId,
      inputFormat: file.type || "image",
      outputFormat: "svg",
      originalSize,
      success: true,
    });

    if (!userId) await incrementUsage(limit.guestId);

    const usage = await getUsage(request);
    const response = successResponse(
      {
        svg: result.svg,
        width: result.width,
        height: result.height,
        imageClass: result.imageClass,
        colorCount: result.colorCount,
        size: result.size,
        advisory: result.advisory,
        conversionsUsed: userId ? undefined : usage.used,
        remaining: userId ? undefined : usage.remaining,
      },
      200,
      undefined,
      request,
    );

    const { setCookie } = ensureGuestId(request);
    if (setCookie) response.cookies.set(setCookie);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(400, "invalid_options", error.issues[0]?.message || "Invalid vectorize options", undefined, request);
    }
    if (error instanceof RasterConversionError) {
      await logConversionError(request, error);
      return errorResponse(error.status, error.code, error.message, undefined, request);
    }
    const failure = classifyRasterError(error);
    await logConversionError(request, error);
    return errorResponse(failure.status, failure.code, failure.message, undefined, request);
  }
}

async function logConversionError(request: NextRequest, error: unknown) {
  const userId = request.headers.get("x-user-id");
  const guestId = !userId ? ensureGuestId(request).guestId : null;
  await logConversion({
    userId,
    guestId,
    inputFormat: "image",
    outputFormat: "svg",
    success: false,
    errorReason: error instanceof Error ? error.message : "vectorization_failed",
  });
}
