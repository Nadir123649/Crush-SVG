import { NextRequest } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/middleware/auth-middleware";
import { checkRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { User } from "@/lib/database/db";
import { successResponse, errorResponse } from "@/lib/http/api-response";

export const runtime = "nodejs";

/**
 * Generate or rotate Developer API Key
 */
export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, "profile:apikey:generate", 10, 60_000);
  if (!rl.allowed) {
    return errorResponse(429, "rate_limit_exceeded", "Too many requests.", rateLimitHeaders(rl), request);
  }

  const who = await auth(request);
  if ("error" in who) return who.error;

  const user = await User.findById(who.user.id);
  if (!user) {
    return errorResponse(404, "not_found", "User not found", undefined, request);
  }

  // Generate cryptographically secure API Key
  const randomHex = crypto.randomBytes(20).toString("hex");
  const newApiKey = `crush_live_${randomHex}`;
  const now = new Date();

  user.apiKey = newApiKey;
  user.apiKeyCreatedAt = now;
  await user.save();

  return successResponse({
    apiKey: newApiKey,
    apiKeyCreatedAt: now.toISOString(),
    apiMonthlyQuota: user.apiMonthlyQuota ?? 1000,
  });
}

/**
 * Revoke Developer API Key
 */
export async function DELETE(request: NextRequest) {
  const rl = await checkRateLimit(request, "profile:apikey:revoke", 10, 60_000);
  if (!rl.allowed) {
    return errorResponse(429, "rate_limit_exceeded", "Too many requests.", rateLimitHeaders(rl), request);
  }

  const who = await auth(request);
  if ("error" in who) return who.error;

  const user = await User.findById(who.user.id);
  if (!user) {
    return errorResponse(404, "not_found", "User not found", undefined, request);
  }

  user.apiKey = null;
  user.apiKeyCreatedAt = null;
  await user.save();

  return successResponse({ success: true, message: "API key revoked successfully" });
}
