import type { NextResponse } from "next/server";
import type { UserDoc } from "@/lib/database/db";
import type { UserDTO } from "@/lib/shared/shared-types";
export const REFRESH_COOKIE_NAME = "crushsvg_refresh";
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

export function clearRefreshCookie(res: NextResponse): void {
    if (process.env.NODE_ENV === "production") {
        res.cookies.delete({
            name: REFRESH_COOKIE_NAME,
            domain: ".crushsvg.net",
            path: "/",
        });
    }
    res.cookies.delete({
        name: REFRESH_COOKIE_NAME,
        path: "/",
    });
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
        role: user.role ?? "user",
        hasPassword: !!user.password,
        isVerified: user.isVerified ?? false,
        conversionsUsed: user.conversionsUsed,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt.toISOString(),
    };
}
