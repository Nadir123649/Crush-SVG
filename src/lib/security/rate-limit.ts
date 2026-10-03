import "server-only";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/security/ip";
import { getRateStore } from "@/lib/security/rate-store";
export interface RateLimitResult {
    allowed: boolean;
    retryAfterSeconds: number;
    limit: number;
    remaining: number;
}
export async function checkRateLimit(request: NextRequest, scope: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const ip = getClientIp(request) ?? "unknown";
    const key = `rl:${scope}:${ip}`;
    const store = getRateStore();
    const count = await store.increment(key, windowMs);
    const allowed = count <= limit;
    // Only rejected requests pay for the TTL lookup. Fixed window: the wait is
    // whatever is left of it, not the full window. Unknown TTL -> full window.
    let retryAfterSeconds = 0;
    if (!allowed) {
        const ttl = await store.ttlMs(key);
        retryAfterSeconds = Math.max(1, Math.ceil((ttl ?? windowMs) / 1000));
    }
    return {
        allowed,
        remaining: Math.max(0, limit - count),
        limit,
        retryAfterSeconds,
    };
}
export function rateLimitHeaders(rl: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
        "Retry-After": String(rl.retryAfterSeconds),
    };
}
