import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/http/api-response";
import { logConversion } from "@/lib/usage/conversion-logger";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  ensureGuestId,
  GUEST_CONVERSION_LIMIT,
} from "@/lib/usage/guest-usage";
import {
  getConversionUsage,
  incrementConversionUsage,
} from "@/lib/usage/conversion-usage";
import { classifyBgRemoveError } from "@/lib/bg-remove/errors";
import { bgRemoveOptionsSchema } from "@/lib/bg-remove/validation";
import { BG_REMOVE_LIMITS, isAcceptedImage } from "@/lib/bg-remove/limits";
import { processBackgroundRemove } from "@/lib/bg-remove/process";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 30;

const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: NextRequest) {
  const { guestId, setCookie } = ensureGuestId(request);
  let currentUsage: Awaited<ReturnType<typeof getConversionUsage>> | null = null;

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

    const usage = await getConversionUsage(request, guestId ?? undefined);
    currentUsage = usage;

    if (usage.kind === "auth-error") {
      return errorResponse(
        401,
        "unauthorized",
        "Session expired. Please sign in again.",
        undefined,
        request,
      );
    }

    if (usage.kind === "guest" && usage.limitReached) {
      return errorResponse(
        429,
        "limit_reached",
        "You've used your 3 free conversions. Create a free account to keep converting.",
        undefined,
        request,
      );
    }

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
      try {
        await incrementConversionUsage(request, guestId ?? undefined);
        await logConversion({
          userId: usage.userId,
          guestId: usage.kind === "guest" ? guestId : undefined,
          inputFormat: file.type || "image",
          outputFormat: "png",
          originalSize,
          success: true,
        });
      } catch (logErr) {
        console.error("[bg-remove] Failed to record conversion usage:", logErr);
      }
    }

    // Invalidate admin dashboard cache for real-time metrics
    revalidatePath('/admin');

    const nextUsed =
      usage.kind === "guest" ? Math.min(GUEST_CONVERSION_LIMIT, usage.count + 1) : undefined;
    const remaining =
      nextUsed !== undefined ? Math.max(0, GUEST_CONVERSION_LIMIT - nextUsed) : undefined;

    // Return binary PNG — avoids base64 inflation (+33%) and JSON serialization overhead
    const headers = new Headers();
    headers.set("Content-Type", "image/png");
    headers.set("Content-Length", String(result.size));
    headers.set("X-Image-Width", String(result.width));
    headers.set("X-Image-Height", String(result.height));
    if (usage.kind === "guest" && nextUsed !== undefined && remaining !== undefined) {
      headers.set("X-Conversions-Used", String(nextUsed));
      headers.set("X-Conversions-Remaining", String(remaining));
    }

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
    await logConversionError(request, guestId, currentUsage?.userId, error);
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

async function logConversionError(
  request: NextRequest,
  guestId: string | null | undefined,
  userId: string | undefined,
  error: unknown,
) {
  try {
    await logConversion({
      userId,
      guestId: userId ? null : (guestId ?? null),
      inputFormat: "image",
      outputFormat: "png",
      success: false,
      errorReason:
        error instanceof Error ? error.message : "processing_failed",
    });
  } catch {
    /* non-fatal */
  }
}
