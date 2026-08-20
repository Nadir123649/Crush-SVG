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
    const count = await getRateStore().increment(key, windowMs);
    const allowed = count <= limit;
    return {
        allowed,
        remaining: Math.max(0, limit - count),
        limit,
        retryAfterSeconds: allowed ? 0 : Math.ceil(windowMs / 1000),
    };
}
export function rateLimitHeaders(rl: RateLimitResult): Record<string, string> {
    return {
        "X-RateLimit-Limit": String(rl.limit),
        "X-RateLimit-Remaining": String(rl.remaining),
        "Retry-After": String(rl.retryAfterSeconds),
    };
}
