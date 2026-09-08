import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/http/api-response";
import { logConversion } from "@/lib/usage/conversion-logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  ensureGuestId,
  getGuestUsage,
  incrementGuestUsage,
  GUEST_CONVERSION_LIMIT,
} from "@/lib/usage/guest-usage";
import { classifyBgRemoveError } from "@/lib/bg-remove/errors";
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

    const isInternalPipeline = request.headers.get("x-internal-pipeline") === "raster-to-svg";

    if (!isInternalPipeline) {
      await logConversion({
        userId: request.headers.get("x-user-id"),
        guestId: limit.guestId,
        inputFormat: file.type || "image",
        outputFormat: "png",
        originalSize,
        success: true,
      });

      if (!isAuthenticated(request)) await incrementUsage(limit.guestId);
    }

    // Invalidate admin dashboard cache for real-time metrics
    revalidatePath('/admin')

    const usage = await getUsage(request);

    // Return binary PNG — avoids base64 inflation (+33%) and JSON serialization overhead
    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set("Content-Length", String(result.size));
    headers.set("X-Image-Width", String(result.width));
    headers.set("X-Image-Height", String(result.height));
    if (!isAuthenticated(request)) {
      headers.set("X-Conversions-Used", String(usage.used));
      headers.set("X-Conversions-Remaining", String(usage.remaining));
    }

    const { setCookie } = ensureGuestId(request);

    const response = new NextResponse(new Uint8Array(result.buffer), { status: 200, headers });

    if (setCookie) {
      response.cookies.set(setCookie.name, setCookie.value, {
        httpOnly: setCookie.httpOnly,
        secure: setCookie.secure,
        sameSite: setCookie.sameSite,
        path: setCookie.path,
        maxAge: setCookie.maxAge,
      });
    }

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
    const failure = classifyBgRemoveError(error);
    await logConversionError(request, error);
    console.error("[bg-remove] Processing error:", error);
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
