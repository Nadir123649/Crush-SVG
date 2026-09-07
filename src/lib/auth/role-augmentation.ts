import "server-only";

/**
 * Module augmentation: locks the canonical role union onto the auth/session
 * contract so middleware and route handlers can rely on `role` without casts.
 *
 * Server-side shapes (decoded access token, edge token) and the client-side
 * UserDTO are kept in sync here. Adding a new role (e.g., "moderator") to the
 * User model requires updating both this file and `shared-types.ts`.
 */
declare module "@/lib/shared/shared-types" {
    interface UserDTO {
        uid: string;
        email: string | null;
        displayName: string;
        name: string | null;
        photoURL: string | null;
        providers: string[];
        linkedProviders: string[];
        role: "user" | "admin";
        hasPassword: boolean;
        isVerified: boolean;
        conversionsUsed: number;
        createdAt: string;
        lastLoginAt: string;
    }
}

declare module "@/lib/auth/tokens" {
    interface DecodedAccessToken {
        id: string;
        role: "user" | "admin";
        jti?: string;
    }
}

declare module "@/lib/auth/edge-tokens" {
    interface EdgeDecodedToken {
        id: string;
        role: "user" | "admin";
        jti?: string;
    }
}

export {};