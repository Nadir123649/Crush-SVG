export interface UserDTO {
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
    apiKey?: string | null;
    apiKeyCreatedAt?: string | null;
    apiMonthlyQuota?: number;
    createdAt: string;
    lastLoginAt: string;
}
export interface TokenPairDTO {
    tokenType: "Bearer";
    accessToken: string;
    accessTokenExpires: string;
    refreshToken: string;
    refreshTokenExpires: string;
}
export interface UsageInfo {
    conversionsUsed: number;
    /** Maximum conversions for the caller's role; `null` means unlimited. */
    limit: number | null;
    remaining: number | null;
    isUnlimited: boolean;
    limitReached?: boolean;
}
