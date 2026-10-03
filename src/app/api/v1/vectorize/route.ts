import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { logConversion } from "@/lib/usage/conversion-logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { ensureGuestId, GUEST_CONVERSION_LIMIT } from "@/lib/usage/guest-usage";
import { getConversionUsage, incrementConversionUsage, type ConversionUsage } from "@/lib/usage/conversion-usage";
import { auth } from "@/lib/middleware/auth-middleware";
import { classifyRasterError, RasterConversionError } from "@/lib/raster/errors";
import { rasterOptionsSchema } from "@/lib/raster/validation";
import { rasterToSvg } from "@/lib/raster/raster-to-svg";
import type { RasterOptions } from "@/lib/raster/types";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

/**
 * Enforces the role-based conversion quota (guest/unverified 3, verified 5,
 * admin unlimited) through the same helper the other conversion endpoints use.
 *
 * This previously skipped the check whenever an `x-user-id` header was present.
 * Nothing in the app ever set that header, so it was purely a client-controlled
 * way to bypass the limit; it has been removed and real session auth is used.
 */
async function enforceConversionLimit(request: NextRequest): Promise<NextResponse | ConversionUsage> {
  const usage = await getConversionUsage(request);
  if (usage.kind === "auth-error") {
    return errorResponse(401, "unauthorized", "Session expired. Please sign in again.", undefined, request);
  }
  if (usage.limitReached) {
    return errorResponse(
      429,
      "limit_reached",
      `You've used your ${usage.limit ?? GUEST_CONVERSION_LIMIT} free conversions.`,
      undefined,
      request,
    );
  }
  return usage;
}

export async function POST(request: NextRequest) {
  try {
    const rate = await checkRateLimit(request, "vectorize", RATE_LIMIT, RATE_WINDOW_MS);
    if (!rate.allowed) {
      return errorResponse(429, "rate_limited", "Too many requests. Slow down and retry.", undefined, request);
    }

    const limitOrResponse = await enforceConversionLimit(request);
    if (limitOrResponse instanceof NextResponse) return limitOrResponse;
    const usage = limitOrResponse;

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

    const result = await rasterToSvg(buffer, options);

    const guestId = usage.kind === "guest" ? ensureGuestId(request).guestId ?? undefined : undefined;

    await logConversion({
      userId: usage.userId,
      guestId,
      inputFormat: file.type || "image",
      outputFormat: "svg",
      originalSize,
      success: true,
    });

    // Increment for guests and authenticated users alike so the enforced quota
    // and the displayed count can never diverge.
    let conversionsUsed = usage.count;
    try {
      conversionsUsed = await incrementConversionUsage(request);
    } catch {
      /* non-fatal */
    }

    // Invalidate admin dashboard cache for real-time metrics
    revalidatePath('/admin')

    const remaining =
      usage.isUnlimited || usage.limit === null ? undefined : Math.max(0, usage.limit - conversionsUsed);

    const response = successResponse(
      {
        svg: result.svg,
        width: result.width,
        height: result.height,
        imageClass: result.imageClass,
        colorCount: result.colorCount,
        size: result.size,
        advisory: result.advisory,
        conversionsUsed,
        remaining,
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
  const who = await auth(request);
  const userId = "user" in who ? who.user.id : undefined;
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
