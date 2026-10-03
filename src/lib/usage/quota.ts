import "server-only";

import { isVerifiedProfile, resolveRole, type RoleSubject } from "@/lib/auth/roles";
import { GUEST_CONVERSION_LIMIT } from "@/lib/usage/guest-usage";

/**
 * Canonical conversion-quota rules.
 *
 * This module is the single source of truth shared by the `/api/v1/usage`
 * endpoint and by every conversion endpoint that enforces the limit, so the
 * number displayed in the UI can never disagree with the number enforced
 * server-side.
 *
 *   guest / unverified  -> FREE_CONVERSION_LIMIT (3)
 *   verified            -> unlimited
 *   admin               -> unlimited
 *
 * Admin is resolved through `resolveRole`, the project's existing
 * authorisation helper. It never inspects email, name or any other cosmetic
 * field, and it enforces the "admin implies verified" invariant (an unverified
 * profile can never observe the admin role).
 */
export const FREE_CONVERSION_LIMIT = GUEST_CONVERSION_LIMIT;

export interface ConversionQuota {
    /** Maximum conversions allowed, or `null` when unlimited. */
    limit: number | null;
    isUnlimited: boolean;
    isAdmin: boolean;
    isVerified: boolean;
}

export interface UsagePayload {
    conversionsUsed: number;
    limit: number | null;
    remaining: number | null;
    isUnlimited: boolean;
    limitReached: boolean;
}

/**
 * Maps an authenticated user document to its conversion entitlement.
 *
 * `subject` only needs the fields already present on `UserDoc` (`role`,
 * `isVerified`, `providers`) — no database access and no new persistence.
 */
export function resolveConversionQuota(subject: RoleSubject): ConversionQuota {
    const isVerified = isVerifiedProfile(subject);
    // `resolveRole` already downgrades an unverified admin to "user", so a
    // `true` result here means a genuinely verified administrator.
    const isAdmin = resolveRole(subject) === "admin";

    // Verified users and admins are unlimited; only guests / unverified users
    // are capped.
    if (isVerified || isAdmin) {
        return { limit: null, isUnlimited: true, isAdmin, isVerified };
    }

    return {
        limit: FREE_CONVERSION_LIMIT,
        isUnlimited: false,
        isAdmin: false,
        isVerified,
    };
}

/**
 * Builds the usage payload for a quota.
 *
 * `conversionsUsed` is always passed through untouched: a user who already
 * exceeds the (possibly lowered) quota keeps their real count and is simply
 * reported as having reached the limit.
 */
export function buildUsagePayload(quota: ConversionQuota, conversionsUsed: number): UsagePayload {
    const used = Math.max(0, conversionsUsed);

    if (quota.isUnlimited) {
        return {
            conversionsUsed: used,
            limit: null,
            remaining: null,
            isUnlimited: true,
            limitReached: false,
        };
    }

    const limit = quota.limit ?? FREE_CONVERSION_LIMIT;
    return {
        conversionsUsed: used,
        limit,
        remaining: Math.max(0, limit - used),
        isUnlimited: false,
        limitReached: used >= limit,
    };
}

/** True when the caller has no conversions left and must be refused. */
export function isQuotaExhausted(quota: ConversionQuota, conversionsUsed: number): boolean {
    return !quota.isUnlimited && conversionsUsed >= (quota.limit ?? FREE_CONVERSION_LIMIT);
}