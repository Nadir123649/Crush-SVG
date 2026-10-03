export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email)
        return false;
    const admins = (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    const normalized = email.toLowerCase().trim();
    return admins.includes(normalized);
}

export interface RoleSubject {
    role?: string | null;
    isVerified?: boolean | null;
    providers?: string[] | null;
}

/**
 * A profile counts as verified when its email is confirmed or it is a Google
 * (OAuth) account. This mirrors `VALID_USER_FILTER` and the admin user routes,
 * so a Google admin is never treated as unverified.
 */
export function isVerifiedProfile(user: RoleSubject): boolean {
    if (user.isVerified === true)
        return true;
    const providers = user.providers;
    return Array.isArray(providers)
        && providers.some(p => p === "google" || p === "google.com");
}

/**
 * Single source of truth for the "admin implies verified" invariant.
 *
 * An unverified profile can never hold the admin role: it is demoted to
 * "user" on read, so neither the UI nor a freshly minted JWT (access or
 * refresh) can observe or grant admin before verification.
 */
export function resolveRole(user: RoleSubject): "user" | "admin" {
    if (user.role !== "admin")
        return "user";
    return isVerifiedProfile(user) ? "admin" : "user";
}
