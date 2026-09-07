/**
 * Module augmentation: extends the auth/session contract with additional
 * fields. Only NEW members may be declared here — re-declaring an existing
 * property (e.g., `role`) with a different type triggers TS2717. The
 * canonical `role: "user" | "admin"` union lives in:
 *   - src/lib/shared/shared-types.ts (UserDTO)
 *   - src/lib/auth/tokens.ts (DecodedAccessToken)
 *   - src/lib/auth/edge-tokens.ts (EdgeDecodedToken)
 *
 * Add a new role (e.g., "moderator") by updating those three base files and
 * extending the `AuthRole` union below so consumers get a single alias.
 */

export type AuthRole = "user" | "admin";

declare module "@/lib/shared/shared-types" {
    interface UserDTO {
        // Intentional additions only — no property re-declarations.
        // `role` is already declared in the base interface.
        // Optional example for future use:
        // lastSeenAt?: string;
    }
}

declare module "@/lib/auth/tokens" {
    interface DecodedAccessToken {
        // No additions; `role` is already declared in the base interface.
    }
}

declare module "@/lib/auth/edge-tokens" {
    interface EdgeDecodedToken {
        // No additions; `role` is already declared in the base interface.
    }
}

export {};