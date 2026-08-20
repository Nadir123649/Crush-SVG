import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/lib/database/db";
import { verifyAccessToken, type DecodedAccessToken } from "@/lib/auth/tokens";
import { getRateStore } from "@/lib/security/rate-store";
export interface AuthUser {
    id: string;
    role: string;
    jti?: string;
}
const SESSION_CACHE_TTL_MS = 5000;
function allowedOrigins(): string[] {
    const list: string[] = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl)
        list.push(appUrl);
    for (const o of (process.env.APP_ORIGINS ?? "").split(",")) {
        const t = o.trim();
        if (t)
            list.push(t);
    }
    if (process.env.NODE_ENV !== "production")
        list.push("http://localhost:3000");
    return [...new Set(list)];
}
export function isMethodExempt(request: NextRequest): boolean {
    return ["GET", "HEAD", "OPTIONS"].includes(request.method);
}
export function isAllowedOrigin(request: NextRequest): boolean {
    const origin = request.headers.get("origin") ?? request.headers.get("referer");
    if (!origin)
        return true;
    let parsed: URL;
    try {
        parsed = new URL(origin);
    }
    catch {
        return false;
    }
    const host = request.headers.get("host");
    if (host && parsed.host === host) {
        return true;
    }
    return allowedOrigins().some((allowed) => {
        try {
            const target = new URL(allowed);
            return parsed.hostname === target.hostname;
        }
        catch {
            return false;
        }
    });
}
export async function invalidateSessionCache(jti?: string): Promise<void> {
    if (jti) {
        await getRateStore().reset(`sess:${jti}`);
    }
    else {
        await getRateStore().clearPrefix("sess:");
    }
}
export async function auth(request: NextRequest): Promise<{
    user: AuthUser;
} | {
    error: Response;
}> {
    if (!isMethodExempt(request) && !isAllowedOrigin(request)) {
        return {
            error: NextResponse.json({ error: "Forbidden origin" }, { status: 403 }),
        };
    }
    const header = request.headers.get("authorization");
    if (!header?.toLowerCase().startsWith("bearer ")) {
        return {
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }
    let decoded: DecodedAccessToken;
    try {
        decoded = await verifyAccessToken(header.slice("bearer ".length));
    }
    catch {
        return {
            error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }
    if (decoded.jti) {
        const store = getRateStore();
        const cacheKey = `sess:${decoded.jti}`;
        const cached = await store.get(cacheKey);
        if (cached === "1") {
            return {
                user: { id: decoded.id, role: decoded.role, jti: decoded.jti },
            };
        }
        if (cached === "0") {
            return {
                error: NextResponse.json({ error: "Session revoked" }, { status: 401 }),
            };
        }
        const session = await Session.findOne({ _id: decoded.jti });
        const valid = !!session &&
            session.userId.toString() === decoded.id &&
            session.status === "active";
        await store.set(cacheKey, valid ? "1" : "0", SESSION_CACHE_TTL_MS);
        if (!valid) {
            return {
                error: NextResponse.json({ error: "Session revoked" }, { status: 401 }),
            };
        }
    }
    return {
        user: { id: decoded.id, role: decoded.role, jti: decoded.jti },
    };
}
