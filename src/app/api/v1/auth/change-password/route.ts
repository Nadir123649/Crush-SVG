import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitHeaders } from "@/lib/security/rate-limit";
import { auth, invalidateSessionCache } from "@/lib/middleware/auth-middleware";
import { changePasswordSchema } from "@/lib/auth/auth-validation";
import { User } from "@/lib/database/db";
import { hashPassword, verifyPassword } from "@/lib/auth/passwords";
import { revokeAllSessions } from "@/lib/auth/sessions";
import { successResponse, errorResponse } from "@/lib/http/api-response";
import { REFRESH_COOKIE_NAME } from "@/lib/auth/auth";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
    const rl = await checkRateLimit(request, "auth:change-password", 5, 60000);
    if (!rl.allowed) {
        return errorResponse(429, "rate_limit_exceeded", "Too many requests.", rateLimitHeaders(rl), request);
    }
    const who = await auth(request);
    if ("error" in who)
        return who.error;
    let body: unknown;
    try {
        body = await request.json();
    }
    catch {
        return errorResponse(400, "", "", undefined, request);
    }
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
        const first = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input";
        return errorResponse(400, "validation_error", first);
    }
    const user = await User.findById(who.user.id);
    if (!user)
        return errorResponse(404, "", "", undefined, request);
    if (!user.password) {
        return errorResponse(400, "", "", undefined, request);
    }
    const isMatch = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!isMatch)
        return errorResponse(401, "", "", undefined, request);
    const isSamePassword = await verifyPassword(parsed.data.newPassword, user.password);
    if (isSamePassword) {
        return errorResponse(400, "same_password", "You are already using this password. Please choose a different password.");
    }
    const newHash = await hashPassword(parsed.data.newPassword);
    await User.updateOne({ _id: user._id }, {
        $set: { password: newHash },
        $unset: { resetPasswordToken: "", resetPasswordTokenExpire: "" },
    });
    await revokeAllSessions(user._id, "revoked");
    await invalidateSessionCache();
    const res = successResponse({ message: "Password changed successfully. Please sign in again." }, 200);
    res.cookies.delete(REFRESH_COOKIE_NAME);
    return res;
}
