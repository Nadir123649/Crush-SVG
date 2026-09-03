import "server-only";
import { NextResponse } from "next/server";
import { auth, type AuthUser } from "@/lib/middleware/auth-middleware";

export async function requireAdmin(request: {
  headers: Headers;
  method: string;
  url: string;
}): Promise<
  | { user: AuthUser }
  | { error: Response }
> {
  const who = await auth(request as any);
  if ("error" in who) return who;

  if (who.user.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          success: false,
          version: "1.0.0",
          payload: {
            error: {
              code: "forbidden",
              message: "Admin access required",
            },
          },
          serverTimestamp: new Date().toISOString(),
        },
        { status: 403 }
      ),
    };
  }

  return who;
}
