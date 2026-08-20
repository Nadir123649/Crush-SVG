import "server-only";
import { NextRequest } from "next/server";
import { auth } from "@/lib/middleware/auth-middleware";
import { User } from "@/lib/database/db";
import { GUEST_CONVERSION_LIMIT, ensureGuestId, getGuestId, getGuestUsage, incrementGuestUsage, type GuestCookieSpec, } from "@/lib/usage/guest-usage";
export { GUEST_CONVERSION_LIMIT };
export class AuthRequiredError extends Error {
    constructor() {
        super("Authentication required");
        this.name = "AuthRequiredError";
    }
}
export type ConversionUsage = {
    kind: "user" | "guest" | "none" | "auth-error";
    count: number;
    limit: number | null;
    remaining: number | null;
    limitReached: boolean;
    userId?: string;
    setGuestCookie?: GuestCookieSpec | null;
};
export async function getConversionUsage(request: NextRequest, explicitGuestId?: string): Promise<ConversionUsage> {
    const who = await auth(request);
    if ("user" in who) {
        const user = await User.findById(who.user.id);
        if (!user) {
            return { kind: "none", count: 0, limit: null, remaining: null, limitReached: false };
        }
        return {
            kind: "user",
            count: user.conversionsUsed,
            limit: null,
            remaining: null,
            limitReached: false,
            userId: who.user.id,
        };
    }
    if (request.headers.get("authorization")?.toLowerCase().startsWith("bearer ")) {
        return { kind: "auth-error", count: 0, limit: null, remaining: null, limitReached: false };
    }
    const guest = ensureGuestId(request);
    const guestId = explicitGuestId ?? guest.guestId;
    if (!guestId) {
        return { kind: "none", count: 0, limit: null, remaining: null, limitReached: false };
    }
    const count = await getGuestUsage(guestId);
    return {
        kind: "guest",
        count,
        limit: GUEST_CONVERSION_LIMIT,
        remaining: Math.max(0, GUEST_CONVERSION_LIMIT - count),
        limitReached: count >= GUEST_CONVERSION_LIMIT,
        setGuestCookie: guest.setCookie,
    };
}
export async function incrementConversionUsage(request: NextRequest, explicitGuestId?: string): Promise<number> {
    const who = await auth(request);
    if ("user" in who) {
        const user = await User.findByIdAndUpdate(who.user.id, { $inc: { conversionsUsed: 1 } }, { new: true });
        return user?.conversionsUsed ?? 0;
    }
    if (request.headers.get("authorization")?.toLowerCase().startsWith("bearer ")) {
        throw new AuthRequiredError();
    }
    const guestId = explicitGuestId ?? getGuestId(request);
    if (!guestId)
        return 0;
    return incrementGuestUsage(guestId);
}
