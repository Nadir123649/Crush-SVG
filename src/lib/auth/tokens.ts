import "server-only";
import jwt from "jsonwebtoken";
export interface TokenPair {
    tokenType: "Bearer";
    accessToken: string;
    accessTokenExpires: string;
    refreshToken: string;
    refreshTokenExpires: string;
}
export interface DecodedAccessToken {
    id: string;
    role: string;
    jti?: string;
}
export interface DecodedRefreshToken {
    id: string;
    jti: string;
    ver?: number;
}
const ACCESS_EXPIRES: jwt.SignOptions["expiresIn"] = (process.env.ACCESS_TOKEN_EXPIRES || "15m") as jwt.SignOptions["expiresIn"];
const REFRESH_EXPIRES: jwt.SignOptions["expiresIn"] = (process.env.REFRESH_TOKEN_EXPIRES || "7d") as jwt.SignOptions["expiresIn"];
function requireSecret(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} must be set`);
    }
    return value;
}
export function generateAccessToken(input: {
    id: string;
    role: string;
    sessionId?: string;
}): string {
    return jwt.sign({ id: input.id, role: input.role, jti: input.sessionId }, requireSecret("JWT_ACCESS_SECRET"), { expiresIn: ACCESS_EXPIRES, algorithm: "HS256" });
}
export function generateRefreshToken(input: {
    id: string;
    sessionId: string;
    tokenVersion?: number;
}): string {
    const payload: Record<string, unknown> = { id: input.id, jti: input.sessionId };
    if (input.tokenVersion !== undefined)
        payload.ver = input.tokenVersion;
    return jwt.sign(payload, requireSecret("JWT_REFRESH_SECRET"), {
        expiresIn: REFRESH_EXPIRES,
        algorithm: "HS256",
    });
}
export function buildTokenPayload(input: {
    id: string;
    role: string;
    sessionId: string;
    tokenVersion?: number;
}): TokenPair {
    if (!input.sessionId) {
        throw new Error("buildTokenPayload: sessionId is required");
    }
    return {
        tokenType: "Bearer",
        accessToken: generateAccessToken({
            id: input.id,
            role: input.role,
            sessionId: input.sessionId,
        }),
        accessTokenExpires: ACCESS_EXPIRES as string,
        refreshToken: generateRefreshToken({
            id: input.id,
            sessionId: input.sessionId,
            tokenVersion: input.tokenVersion,
        }),
        refreshTokenExpires: REFRESH_EXPIRES as string,
    };
}
export function verifyAccessToken(token: string): Promise<DecodedAccessToken> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, requireSecret("JWT_ACCESS_SECRET"), { algorithms: ["HS256"] }, (err, decoded) => {
            if (err || !decoded || typeof decoded !== "object") {
                reject(err ?? new Error("Invalid token"));
                return;
            }
            resolve({
                id: String(decoded.id),
                role: String(decoded.role ?? "free"),
                jti: decoded.jti ? String(decoded.jti) : undefined,
            });
        });
    });
}
export function verifyRefreshToken(token: string): Promise<DecodedRefreshToken> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, requireSecret("JWT_REFRESH_SECRET"), { algorithms: ["HS256"] }, (err, decoded) => {
            if (err || !decoded || typeof decoded !== "object" || !decoded.jti) {
                reject(err ?? new Error("Invalid token"));
                return;
            }
            resolve({
                id: String(decoded.id),
                jti: String(decoded.jti),
                ver: typeof decoded.ver === "number" ? decoded.ver : undefined,
            });
        });
    });
}
