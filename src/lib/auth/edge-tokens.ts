/**
 * Edge-compatible JWT verification — no `import "server-only"`.
 * Used by src/middleware.ts which runs at the edge runtime.
 */
import { jwtVerify } from "jose";

export interface EdgeDecodedToken {
  id: string;
  role: string;
  jti?: string;
}

export async function verifyAccessTokenEdge(
  token: string
): Promise<EdgeDecodedToken | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    if (!payload || typeof payload.id !== "string") return null;

    return {
      id: payload.id,
      role: String(payload.role ?? "free"),
      jti: typeof payload.jti === "string" ? payload.jti : undefined,
    };
  } catch {
    return null;
  }
}
