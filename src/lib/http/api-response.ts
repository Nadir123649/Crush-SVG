import { NextRequest, NextResponse } from "next/server";
import { getRequestId } from "@/lib/shared/logger";
export function successResponse(data: unknown, status = 200, headers?: Record<string, string>, request?: NextRequest) {
    const responseHeaders: Record<string, string> = { ...headers };
    if (request)
        responseHeaders["x-request-id"] = getRequestId(request);
    return NextResponse.json({
        success: true,
        version: "1.0.0",
        payload: data,
        serverTimestamp: new Date().toISOString(),
    }, { status, headers: responseHeaders });
}
export function errorResponse(status: number, code: string, message: string, headers?: Record<string, string>, request?: NextRequest) {
    const responseHeaders: Record<string, string> = { ...headers };
    if (request)
        responseHeaders["x-request-id"] = getRequestId(request);
    return NextResponse.json({
        success: false,
        version: "1.0.0",
        payload: { error: { code, message } },
        serverTimestamp: new Date().toISOString(),
    }, { status, headers: responseHeaders });
}
function canonicalBase(): string {
    return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
}
function allowedHosts(): string[] {
    return (process.env.APP_ORIGINS ?? process.env.NEXT_PUBLIC_APP_URL ?? "")
        .split(",")
        .map((s) => s.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase())
        .filter(Boolean);
}
function hostAllowed(host: string): boolean {
    const allowed = allowedHosts();
    if (allowed.length === 0)
        return true;
    const normalized = host.toLowerCase().replace(/:\d+$/, "");
    return allowed.some((a) => a.replace(/:\d+$/, "") === normalized);
}
function isLocalHost(host: string): boolean {
    const h = host.toLowerCase().split(":")[0];
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
}
function looksLikeIp(host: string): boolean {
    const h = host.toLowerCase().split(":")[0];
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(h) || /^[0-9a-f:]{2,45}$/.test(h);
}
function originFromHost(request: NextRequest, host: string): string {
    const protocol = request.headers.get("x-forwarded-proto") ||
        (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    return `${protocol}://${host}`;
}
export function getOrigin(request: NextRequest): string {
    const host = request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        "";
    if (host && (hostAllowed(host) || trustProxy())) {
        // API subdomain should never be the canonical origin for email links,
        // password resets, or any user-facing redirect — fall back to frontend.
        const normalized = host.toLowerCase().replace(/:\d+$/, "");
        if (/^(api|staging\.api)\.crushsvg\.net$/.test(normalized)) {
            return canonicalBase() || "https://crushsvg.net";
        }
        return originFromHost(request, host);
    }
    if (host && !isLocalHost(host) && !looksLikeIp(host)) {
        return originFromHost(request, host);
    }
    const canonical = canonicalBase();
    if (canonical)
        return canonical;
    return `https://${allowedHosts()[0] ?? "localhost"}`;
}
function trustProxy(): boolean {
    return process.env.TRUST_PROXY === "true";
}
