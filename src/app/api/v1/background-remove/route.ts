import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { logConversion } from "@/lib/usage/conversion-logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  ensureGuestId,
  getGuestUsage,
  incrementGuestUsage,
  GUEST_CONVERSION_LIMIT,
} from "@/lib/usage/guest-usage";
import { classifyBgRemoveError, BgRemoveError } from "@/lib/bg-remove/errors";
import { bgRemoveOptionsSchema } from "@/lib/bg-remove/validation";
import { BG_REMOVE_LIMITS, isAcceptedImage } from "@/lib/bg-remove/limits";
import { processBackgroundRemove } from "@/lib/bg-remove/process";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

async function getUsage(request: NextRequest) {
  const guestId = ensureGuestId(request).guestId ?? crypto.randomUUID();
  try {
    const used = Math.min(await getGuestUsage(guestId), GUEST_CONVERSION_LIMIT);
    return {
      guestId,
      maxConversions: GUEST_CONVERSION_LIMIT,
      used,
      remaining: Math.max(GUEST_CONVERSION_LIMIT - used, 0),
    };
  } catch {
    return {
      guestId,
      maxConversions: GUEST_CONVERSION_LIMIT,
      used: 0,
      remaining: GUEST_CONVERSION_LIMIT,
    };
  }
}

function isAuthenticated(request: NextRequest): boolean {
  return !!(
    request.headers.get("x-user-id") ||
    request.headers.get("authorization")?.toLowerCase().startsWith("bearer ")
  );
}

async function enforceGuestLimit(
  request: NextRequest,
): Promise<
  | NextResponse
  | {
      guestId: string;
      maxConversions: number;
      used: number;
      remaining: number;
    }
> {
  if (isAuthenticated(request)) return getUsage(request);
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
    const rate = await checkRateLimit(
      request,
      "bg-remove",
      RATE_LIMIT,
      RATE_WINDOW_MS,
    );
    if (!rate.allowed) {
      return errorResponse(
        429,
        "rate_limited",
        "Too many requests. Slow down and retry.",
        undefined,
        request,
      );
    }

    const limitOrResponse = await enforceGuestLimit(request);
    if (limitOrResponse instanceof NextResponse) return limitOrResponse;
    const limit = limitOrResponse;

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return errorResponse(
        400,
        "missing_file",
        "No image file provided.",
        undefined,
        request,
      );
    }
    if (file.size > BG_REMOVE_LIMITS.MAX_UPLOAD_BYTES) {
      return errorResponse(
        400,
        "file_too_large",
        "Image exceeds the 10MB upload limit.",
        undefined,
        request,
      );
    }

    const options = bgRemoveOptionsSchema.parse({
      scale: form.get("scale") ?? undefined,
      bgOption: form.get("bgOption") ?? undefined,
      bgColor: form.get("bgColor") ?? undefined,
    });

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isAcceptedImage(buffer)) {
      return errorResponse(
        400,
        "invalid_image",
        "Unsupported image format. Upload a PNG, JPEG, or WebP image.",
        undefined,
        request,
      );
    }

    const originalSize = file.size;

    const result = await processBackgroundRemove(buffer, options);

    await logConversion({
      userId: request.headers.get("x-user-id"),
      guestId: limit.guestId,
      inputFormat: file.type || "image",
      outputFormat: "png",
      originalSize,
      success: true,
    });

    if (!isAuthenticated(request)) await incrementUsage(limit.guestId);

    const usage = await getUsage(request);
    const response = successResponse(
      {
        dataUrl: result.dataUrl,
        format: result.format,
        size: result.size,
        width: result.width,
        height: result.height,
        conversionsUsed: isAuthenticated(request) ? undefined : usage.used,
        remaining: isAuthenticated(request) ? undefined : usage.remaining,
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
      return errorResponse(
        400,
        "invalid_options",
        error.issues[0]?.message || "Invalid background removal options",
        undefined,
        request,
      );
    }
    if (error instanceof BgRemoveError) {
      await logConversionError(request, error);
      return errorResponse(
        error.status,
        error.code,
        error.message,
        undefined,
        request,
      );
    }
    const failure = classifyBgRemoveError(error);
    await logConversionError(request, error);
    return errorResponse(
      failure.status,
      failure.code,
      failure.message,
      undefined,
      request,
    );
  }
}

async function logConversionError(request: NextRequest, error: unknown) {
  const userId = request.headers.get("x-user-id");
  const guestId =
    userId || isAuthenticated(request) ? null : ensureGuestId(request).guestId;
  await logConversion({
    userId,
    guestId,
    inputFormat: "image",
    outputFormat: "png",
    success: false,
    errorReason:
      error instanceof Error ? error.message : "processing_failed",
  });
}
