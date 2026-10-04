import type { NextResponse } from "next/server";
import type { UserDoc } from "@/lib/database/db";
import type { UserDTO } from "@/lib/shared/shared-types";
import { resolveRole } from "@/lib/auth/roles";
export const REFRESH_COOKIE_NAME = "crushsvg_refresh";
// Non-httpOnly flag so the client can tell a session exists without reading the
// refresh token. Always written next to the refresh cookie with the same
// lifetime/domain so the two can never drift apart.
export const SESSION_FLAG_COOKIE_NAME = "crushsvg_session";
export type { UserDTO, TokenPairDTO, UsageInfo } from "@/lib/shared/shared-types";

export function getRefreshCookieOptions(remember = false) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
        domain: process.env.NODE_ENV === "production" ? ".crushsvg.net" : undefined,
        maxAge: remember ? 7 * 24 * 60 * 60 : undefined,
    };
}

export function setSessionCookies(res: NextResponse, refreshToken: string, remember = false): void {
    const options = getRefreshCookieOptions(remember);
    res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, options);
    res.cookies.set(SESSION_FLAG_COOKIE_NAME, "1", { ...options, httpOnly: false });
}

// Pass only name/path/domain: delete() keeps any maxAge it is given and turns it
// into a future expiry, which would store an empty cookie instead of removing it.
export function clearRefreshCookie(res: NextResponse): void {
    const { path, domain } = getRefreshCookieOptions();
    res.cookies.delete({ name: REFRESH_COOKIE_NAME, path, domain });
    res.cookies.delete({ name: SESSION_FLAG_COOKIE_NAME, path, domain });
}
export function toUserDTO(user: UserDoc): UserDTO {
    return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        name: user.name ?? user.displayName,
        photoURL: user.photoURL,
        providers: user.providers,
        linkedProviders: user.linkedProviders ?? user.providers,
        role: resolveRole(user),
        hasPassword: !!user.password,
        isVerified: user.isVerified ?? false,
        conversionsUsed: user.conversionsUsed,
        apiKey: user.apiKey ?? null,
        apiKeyCreatedAt: user.apiKeyCreatedAt ? user.apiKeyCreatedAt.toISOString() : null,
        apiMonthlyQuota: user.apiMonthlyQuota ?? 1000,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: (user.lastLoginAt ?? user.createdAt).toISOString(),
    };
}
