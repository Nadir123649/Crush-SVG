import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { logConversion } from "@/lib/usage/conversion-logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { ensureGuestId, getGuestUsage, incrementGuestUsage, GUEST_CONVERSION_LIMIT } from "@/lib/usage/guest-usage";
import { classifyRasterError, RasterConversionError } from "@/lib/raster/errors";
import { rasterOptionsSchema } from "@/lib/raster/validation";
import { rasterToSvg, recommendQueue } from "@/lib/raster/raster-to-svg";
import { rasterToSvgQueued, rasterQueueEnabled } from "@/lib/raster/raster-queue";
import { auth } from "@/lib/middleware/auth-middleware";
import type { RasterOptions } from "@/lib/raster/types";

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

async function enforceGuestLimit(request: NextRequest): Promise<NextResponse | { guestId: string; maxConversions: number; used: number; remaining: number; userId?: string }> {
  // Check Bearer token for authenticated users (client sends Authorization header, not x-user-id)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const who = await auth(request);
    if ("user" in who) {
      // Authenticated user — unlimited conversions, skip guest limit
      return { guestId: "", maxConversions: Infinity, used: 0, remaining: Infinity, userId: who.user.id };
    }
    // Token present but invalid/expired — fall through to guest path
  }

  // Legacy x-user-id header check (for any external callers)
  if (request.headers.get("x-user-id")) return getUsage(request);

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

    const limitOrResponse = await enforceGuestLimit(request);
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

    let result;
    if (rasterQueueEnabled() && (await recommendQueue(buffer))) {
      result = await rasterToSvgQueued(buffer, options);
    } else {
      result = await rasterToSvg(buffer, options);
    }

    await logConversion({
      userId: limit.userId ?? request.headers.get("x-user-id"),
      guestId: limit.userId ? undefined : limit.guestId,
      inputFormat: file.type || "image",
      outputFormat: "svg",
      originalSize,
      success: true,
    });

    if (!limit.userId) await incrementUsage(limit.guestId);

    const usage = limit.userId ? { used: 0, remaining: Infinity } : await getUsage(request);
    const response = successResponse(
      {
        svg: result.svg,
        width: result.width,
        height: result.height,
        imageClass: result.imageClass,
        colorCount: result.colorCount,
        size: result.size,
        advisory: result.advisory,
        conversionsUsed: limit.userId ? undefined : usage.used,
        remaining: limit.userId ? undefined : usage.remaining,
      },
      200,
      undefined,
      request,
    );

    const { setCookie } = ensureGuestId(request);
    if (setCookie) response.cookies.set(setCookie);
    return response;
  } catch (error) {
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
  const authHeader = request.headers.get("authorization");
  let userId: string | null = null;
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const who = await auth(request);
    if ("user" in who) userId = who.user.id;
  }
  if (!userId) userId = request.headers.get("x-user-id");
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
