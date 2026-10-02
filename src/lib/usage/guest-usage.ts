import "server-only";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import { GuestUsage, isDuplicateKeyError } from "@/lib/database/db";
export const GUEST_CONVERSION_LIMIT = 3;
export const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;
export const GUEST_COOKIE_NAME = "gid";
const GUEST_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
export function getGuestId(request: NextRequest): string | null {
    return request.cookies.get(GUEST_COOKIE_NAME)?.value ?? null;
}
export interface GuestCookieSpec {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax";
    path: string;
    maxAge: number;
}
export function ensureGuestId(request: NextRequest, env: NodeJS.ProcessEnv = process.env): {
    guestId: string | null;
    setCookie: GuestCookieSpec | null;
} {
    const existing = request.cookies.get(GUEST_COOKIE_NAME)?.value;
    if (existing)
        return { guestId: existing, setCookie: null };
    const guestId = randomUUID();
    return {
        guestId,
        setCookie: {
            name: GUEST_COOKIE_NAME,
            value: guestId,
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: GUEST_COOKIE_MAX_AGE,
        },
    };
}
function windowExpired(record: {
    windowStartAt?: Date | null;
} | null): boolean {
    if (!record)
        return true;
    const start = record.windowStartAt?.getTime();
    if (!start)
        return false;
    return Date.now() - start >= GUEST_WINDOW_MS;
}
export async function getGuestUsage(guestId: string): Promise<number> {
    const record = await GuestUsage.findById(guestId);
    if (windowExpired(record))
        return 0;
    return record?.conversionsUsed ?? 0;
}
export async function incrementGuestUsage(guestId: string): Promise<number> {
    const now = new Date();
    let record = await GuestUsage.findById(guestId);
    if (!record) {
        try {
            await GuestUsage.create({ _id: guestId, conversionsUsed: 1, windowStartAt: now });
            return 1;
        }
        catch (error) {
            if (!isDuplicateKeyError(error))
                throw error;
            record = await GuestUsage.findById(guestId);
        }
    }
    if (windowExpired(record)) {
        const reset = await GuestUsage.findOneAndUpdate({ _id: guestId }, { $set: { conversionsUsed: 1, windowStartAt: now } }, { new: true });
        return reset?.conversionsUsed ?? 1;
    }
    const incremented = await GuestUsage.findOneAndUpdate({ _id: guestId, conversionsUsed: { $lt: GUEST_CONVERSION_LIMIT } }, { $inc: { conversionsUsed: 1 } }, { new: true });
    return incremented?.conversionsUsed ?? GUEST_CONVERSION_LIMIT;
}

/**
 * Atomically claim one conversion slot before rendering.
 * Returns the new count (1–GUEST_CONVERSION_LIMIT) if the slot was claimed,
 * or null if the guest is already at the limit. Never exceeds the limit even
 * under concurrent requests because the $lt filter is atomic in MongoDB.
 */
export async function claimGuestSlot(guestId: string): Promise<number | null> {
    // Every step is a single conditional write, so concurrent claims cannot
    // double-reset an expired window or exceed the limit. _id is the guestId,
    // so create() can never produce a second document for the same guest.
    for (let attempt = 0; attempt < 3; attempt++) {
        const now = new Date();
        const cutoff = new Date(now.getTime() - GUEST_WINDOW_MS);

        const reset = await GuestUsage.findOneAndUpdate(
            { _id: guestId, windowStartAt: { $lte: cutoff } },
            { $set: { conversionsUsed: 1, windowStartAt: now } },
            { new: true }
        );
        if (reset) return reset.conversionsUsed;

        const incremented = await GuestUsage.findOneAndUpdate(
            { _id: guestId, conversionsUsed: { $lt: GUEST_CONVERSION_LIMIT } },
            { $inc: { conversionsUsed: 1 } },
            { new: true }
        );
        if (incremented) return incremented.conversionsUsed;

        if (await GuestUsage.exists({ _id: guestId })) return null;

        try {
            await GuestUsage.create({ _id: guestId, conversionsUsed: 1, windowStartAt: now });
            return 1;
        } catch (error) {
            if (!isDuplicateKeyError(error)) throw error;
        }
    }
    return null;
}

/**
 * Release a previously claimed slot, e.g. when the render fails after
 * claimGuestSlot() already incremented the counter.
 */
export async function releaseGuestSlot(guestId: string): Promise<void> {
    await GuestUsage.findOneAndUpdate(
        { _id: guestId, conversionsUsed: { $gt: 0 } },
        { $inc: { conversionsUsed: -1 } }
    );
}
