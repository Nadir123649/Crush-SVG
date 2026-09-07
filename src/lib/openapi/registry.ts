import { z } from "zod";
import { extendZodWithOpenApi, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ── Shared response envelope ─────────────────────────────────────────

const SuccessEnvelope = <T extends z.ZodTypeAny>(payload: T) =>
  z.object({
    success: z.literal(true),
    version: z.string(),
    payload: payload,
    serverTimestamp: z.string().datetime(),
  });

const ErrorPayload = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const ErrorEnvelope = z.object({
  success: z.literal(false),
  version: z.string(),
  payload: ErrorPayload,
  serverTimestamp: z.string().datetime(),
});

// ── Shared DTOs ──────────────────────────────────────────────────────

const UserDTO = registry.register(
  "UserDTO",
  z.object({
    uid: z.string(),
    email: z.string().nullable(),
    displayName: z.string(),
    name: z.string().nullable(),
    photoURL: z.string().nullable(),
    providers: z.array(z.string()),
    linkedProviders: z.array(z.string()),
    role: z.enum(["user", "admin"]),
    hasPassword: z.boolean(),
    isVerified: z.boolean(),
    conversionsUsed: z.number(),
    createdAt: z.string(),
    lastLoginAt: z.string(),
  })
);

const TokenPairDTO = registry.register(
  "TokenPairDTO",
  z.object({
    tokenType: z.literal("Bearer"),
    accessToken: z.string(),
    accessTokenExpires: z.string(),
    refreshToken: z.string(),
    refreshTokenExpires: z.string(),
  })
);

const UsageInfo = registry.register(
  "UsageInfo",
  z.object({
    conversionsUsed: z.number(),
    remaining: z.number().nullable(),
    isUnlimited: z.boolean(),
    limitReached: z.boolean().optional(),
  })
);

// ── Auth ─────────────────────────────────────────────────────────────

const loginBody = registry.register(
  "LoginBody",
  z.object({
    email: z.string().min(1).email(),
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
  })
);

const registerBody = registry.register(
  "RegisterBody",
  z.object({
    name: z.string().min(3).max(16),
    email: z.string().email(),
    password: z.string().min(8).max(20),
  })
);

const changePasswordBody = registry.register(
  "ChangePasswordBody",
  z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(20),
  })
);

const forgotPasswordBody = registry.register(
  "ForgotPasswordBody",
  z.object({
    email: z.string().email(),
  })
);

const resetPasswordBody = registry.register(
  "ResetPasswordBody",
  z.object({
    token: z.string(),
    password: z.string().min(8).max(20),
  })
);

// ── SVG / Convert ────────────────────────────────────────────────────

const svgValidationBody = registry.register(
  "SvgValidationBody",
  z.object({
    svg: z.string().min(1),
  })
);

const convertBody = registry.register(
  "ConvertBody",
  z.object({
    svg: z.string().min(1).max(10 * 1024 * 1024),
    width: z.number().int().min(1).max(4000).optional(),
    height: z.number().int().min(1).max(4000).optional(),
    scale: z.number().min(0.1).max(16).default(2),
    transparent: z.boolean().default(true),
    quality: z.number().int().min(1).max(100).default(90),
  })
);

// ── Raster / Vectorize ───────────────────────────────────────────────

const vectorizeBody = registry.register(
  "VectorizeBody",
  z.object({
    file: z.string().describe("Image file (multipart/form-data)"),
    mode: z.enum(["auto", "logo", "line-art", "photo"]).optional(),
    quality: z.enum(["draft", "standard", "max"]).optional(),
    colorCount: z.number().int().min(2).max(64).optional(),
    background: z.enum(["preserve", "transparent", "custom"]).optional(),
    bgColor: z.string().optional(),
  })
);

// ── Profile / Usage ──────────────────────────────────────────────────

const updateProfileBody = registry.register(
  "UpdateProfileBody",
  z.object({
    displayName: z.string().min(3).max(16).optional(),
    name: z.string().min(3).max(16).optional(),
  })
);

const trackUsageBody = registry.register(
  "TrackUsageBody",
  z.object({
    guestId: z.string().optional(),
    isAuthenticated: z.boolean().optional(),
  })
);

// ── Conversion history query ─────────────────────────────────────────

const conversionHistoryQuery = registry.register(
  "ConversionHistoryQuery",
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["createdAt", "-createdAt"]).default("-createdAt"),
  })
);

// ═════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═════════════════════════════════════════════════════════════════════

// ── Auth ─────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  tags: ["Auth"],
  summary: "Login with email and password",
  request: { body: { content: { "application/json": { schema: loginBody } } } },
  responses: {
    200: {
      description: "Login successful",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              token: TokenPairDTO,
              sessionId: z.string(),
              remember: z.boolean().optional(),
              user: UserDTO,
            })
          ),
        },
      },
    },
    401: { description: "Invalid credentials", content: { "application/json": { schema: ErrorEnvelope } } },
    429: { description: "Rate limited" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/register",
  tags: ["Auth"],
  summary: "Register a new account",
  request: { body: { content: { "application/json": { schema: registerBody } } } },
  responses: {
    201: {
      description: "Registration successful — verification email sent",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ message: z.string() })) } },
    },
    409: { description: "Account already exists" },
    429: { description: "Rate limited" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  description: "Uses the HTTP-only refresh token cookie to issue a new token pair.",
  responses: {
    200: {
      description: "Token refreshed",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              token: TokenPairDTO,
              sessionId: z.string(),
              remember: z.boolean().optional(),
              user: UserDTO,
            })
          ),
        },
      },
    },
    401: { description: "Session revoked" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/logout",
  tags: ["Auth"],
  summary: "Logout current session",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "Logged out",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ message: z.string() })) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/logout-all",
  tags: ["Auth"],
  summary: "Logout all sessions",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "All sessions revoked",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ message: z.string() })) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/change-password",
  tags: ["Auth"],
  summary: "Change password",
  security: [{ BearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: changePasswordBody } } } },
  responses: {
    200: {
      description: "Password changed — all sessions revoked",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ message: z.string() })) } },
    },
    401: { description: "Current password incorrect" },
  },
});

// ── Passwords ────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/passwords/forgot",
  tags: ["Passwords"],
  summary: "Request password reset email",
  request: { body: { content: { "application/json": { schema: forgotPasswordBody } } } },
  responses: {
    200: {
      description: "Reset email sent (if account exists)",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ message: z.string() })) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/passwords/reset",
  tags: ["Passwords"],
  summary: "Reset password with token",
  request: { body: { content: { "application/json": { schema: resetPasswordBody } } } },
  responses: {
    200: {
      description: "Password reset successful",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ message: z.string() })) } },
    },
    400: { description: "Invalid or expired token" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/passwords/reset",
  tags: ["Passwords"],
  summary: "Validate reset token",
  parameters: [{ name: "token", in: "query", required: true, schema: { type: "string" } }],
  responses: {
    200: {
      description: "Token validation result",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ valid: z.boolean() })) } },
    },
  },
});

// ── SVG ──────────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/svg/validate",
  tags: ["SVG"],
  summary: "Validate SVG content",
  request: { body: { content: { "application/json": { schema: svgValidationBody } } } },
  responses: {
    200: {
      description: "SVG is valid",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ valid: z.literal(true), message: z.string() })) } },
    },
    422: { description: "SVG is invalid" },
  },
});

// ── Convert (SVG → PNG) ──────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/convert",
  tags: ["Convert"],
  summary: "Convert SVG to PNG",
  description: "Accepts SVG content and returns a PNG. Supports custom dimensions, scale, transparency, and quality.",
  request: { body: { content: { "application/json": { schema: convertBody } } } },
  responses: {
    200: {
      description: "Conversion successful",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              data: z.string().describe("Base64-encoded PNG"),
              mimeType: z.string(),
              size: z.number(),
              format: z.string(),
              width: z.number(),
              height: z.number(),
              warnings: z.array(z.string()).optional(),
              conversionsUsed: z.number(),
              remaining: z.number().nullable().optional(),
            })
          ),
        },
      },
    },
    429: { description: "Rate limited or guest limit reached" },
  },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/convert",
  tags: ["Convert"],
  summary: "Get conversion endpoint info",
  responses: {
    200: {
      description: "Endpoint info",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            version: z.string(),
            payload: z.object({
              message: z.string(),
              formats: z.array(z.string()),
              maxOutputSize: z.number(),
              example: z.object({
                svg: z.string(),
                width: z.number(),
                scale: z.number(),
                transparent: z.boolean(),
                quality: z.number(),
              }),
            }),
            serverTimestamp: z.string(),
          }),
        },
      },
    },
  },
});

// ── Vectorize (Raster → SVG) ─────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/vectorize",
  tags: ["Vectorize"],
  summary: "Convert raster image to SVG",
  description: "Upload a PNG/JPEG/WebP image and get an SVG trace. Uses VTrace WASM engine.",
  request: {
    body: {
      content: { "multipart/form-data": { schema: vectorizeBody } },
    },
  },
  responses: {
    200: {
      description: "Vectorization successful",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              svg: z.string(),
              width: z.number(),
              height: z.number(),
              imageClass: z.string(),
              colorCount: z.number(),
              size: z.number(),
              advisory: z.string().optional(),
              conversionsUsed: z.number().optional(),
              remaining: z.number().optional(),
            })
          ),
        },
      },
    },
    429: { description: "Rate limited or guest limit reached" },
  },
});

// ── Background Remove ────────────────────────────────────────────────

const backgroundRemoveBody = registry.register(
  "BackgroundRemoveBody",
  z.object({
    file: z.string().describe("Image file (multipart/form-data)"),
    scale: z.enum(["25", "50", "75", "100", "125", "150", "200"]).optional(),
    bgOption: z.enum(["Transparent", "White", "Black", "Custom"]).optional(),
    bgColor: z.string().optional(),
  })
);

registry.registerPath({
  method: "post",
  path: "/api/v1/background-remove",
  tags: ["Background Remove"],
  summary: "Remove image background",
  description:
    "Upload a PNG/JPEG/WebP image and get a background-removed PNG. Supports transparent, white, black, or custom-colored backgrounds with configurable output scale.",
  request: {
    body: {
      content: { "multipart/form-data": { schema: backgroundRemoveBody } },
    },
  },
  responses: {
    200: {
      description: "Background removal successful",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              dataUrl: z.string().describe("Base64 data URL of the result PNG"),
              format: z.string(),
              size: z.number(),
              width: z.number(),
              height: z.number(),
              conversionsUsed: z.number().optional(),
              remaining: z.number().optional(),
            })
          ),
        },
      },
    },
    429: { description: "Rate limited or guest limit reached" },
  },
});

// ── Upload ───────────────────────────────────────────────────────────

registry.registerPath({
  method: "post",
  path: "/api/v1/uploads",
  tags: ["Upload"],
  summary: "Upload image or SVG",
  description: "Upload a PNG/JPEG/WebP image for storage, or an SVG for automatic conversion to PNG.",
  responses: {
    200: {
      description: "Upload successful",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              url: z.string().describe("Cloudinary secure URL"),
              publicId: z.string(),
              width: z.number().optional(),
              height: z.number().optional(),
              format: z.string().optional(),
              size: z.number().optional(),
              warnings: z.array(z.string()).optional(),
              conversionsUsed: z.number().optional(),
              remaining: z.number().nullable().optional(),
            })
          ),
        },
      },
    },
  },
});

// ── Usage ────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/usage",
  tags: ["Usage"],
  summary: "Get current usage info",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "Usage info",
      content: { "application/json": { schema: SuccessEnvelope(UsageInfo) } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/usage",
  tags: ["Usage"],
  summary: "Track a conversion usage",
  request: { body: { content: { "application/json": { schema: trackUsageBody } } } },
  responses: {
    200: {
      description: "Usage tracked",
      content: { "application/json": { schema: SuccessEnvelope(UsageInfo) } },
    },
  },
});

// ── Profile ──────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/profile",
  tags: ["Profile"],
  summary: "Get current user profile",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "User profile",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ user: UserDTO })) } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/v1/profile",
  tags: ["Profile"],
  summary: "Update profile",
  security: [{ BearerAuth: [] }],
  request: { body: { content: { "application/json": { schema: updateProfileBody } } } },
  responses: {
    200: {
      description: "Profile updated",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ user: UserDTO })) } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/api/v1/profile",
  tags: ["Profile"],
  summary: "Delete account",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: z.object({ password: z.string().min(1) }) } },
    },
  },
  responses: {
    200: {
      description: "Account deleted",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ message: z.string() })) } },
    },
    401: { description: "Password incorrect" },
  },
});

// ── Me ───────────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/me",
  tags: ["Auth"],
  summary: "Get current user (quick check)",
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: "Current user",
      content: { "application/json": { schema: z.object({ user: UserDTO }) } },
    },
  },
});

// ── Conversions ──────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/conversions",
  tags: ["Conversions"],
  summary: "Get conversion history",
  security: [{ BearerAuth: [] }],
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
    { name: "sort", in: "query", schema: { type: "string", enum: ["createdAt", "-createdAt"], default: "-createdAt" } },
  ],
  responses: {
    200: {
      description: "Conversion history",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              data: z.array(z.any()),
              meta: z.object({
                total: z.number(),
                page: z.number(),
                per_page: z.number(),
                total_pages: z.number(),
                has_next: z.boolean(),
                has_prev: z.boolean(),
              }),
              links: z.record(z.string(), z.string().nullable()),
              usage: UsageInfo,
              message: z.string(),
            })
          ),
        },
      },
    },
  },
});

// ── Health ───────────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  tags: ["System"],
  summary: "Health check",
  responses: {
    200: {
      description: "Service healthy",
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum(["healthy", "degraded"]),
            timestamp: z.string().datetime(),
            version: z.string(),
            environment: z.string(),
            checks: z.record(z.string(),
              z.object({
                status: z.enum(["ok", "error"]),
                message: z.string().optional(),
                latencyMs: z.number().optional(),
              })
            ),
          }),
        },
      },
    },
    503: { description: "Service degraded" },
  },
});

// ── Admin: Users ─────────────────────────────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/users",
  tags: ["Admin"],
  summary: "List users (admin)",
  security: [{ BearerAuth: [] }],
  parameters: [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
    { name: "search", in: "query", schema: { type: "string" } },
    { name: "status", in: "query", schema: { type: "string", enum: ["verified", "unverified"] } },
    { name: "role", in: "query", schema: { type: "string", enum: ["user", "admin"] } },
    { name: "sortBy", in: "query", schema: { type: "string" } },
    { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
  ],
  responses: {
    200: {
      description: "User list",
      content: {
        "application/json": {
          schema: SuccessEnvelope(
            z.object({
              data: z.array(UserDTO),
              meta: z.object({
                total: z.number(),
                page: z.number(),
                per_page: z.number(),
                total_pages: z.number(),
                has_next: z.boolean(),
                has_prev: z.boolean(),
              }),
            })
          ),
        },
      },
    },
    403: { description: "Admin access required" },
  },
});

registry.registerPath({
  method: "post",
  path: "/api/v1/admin/users",
  tags: ["Admin"],
  summary: "Create user (admin)",
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            displayName: z.string().optional(),
            role: z.enum(["user", "admin"]).default("user"),
            password: z.string().min(8),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created",
      content: { "application/json": { schema: SuccessEnvelope(z.object({ user: UserDTO })) } },
    },
    409: { description: "Email already taken" },
  },
});

// ── Admin: Settings, Audits, Conversions ─────────────────────────────

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/settings",
  tags: ["Admin"],
  summary: "Get site settings (admin)",
  security: [{ BearerAuth: [] }],
  responses: { 200: { description: "Settings" } },
});

registry.registerPath({
  method: "put",
  path: "/api/v1/admin/settings",
  tags: ["Admin"],
  summary: "Update site settings (admin)",
  security: [{ BearerAuth: [] }],
  responses: { 200: { description: "Settings updated" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/audits",
  tags: ["Admin"],
  summary: "List audit logs (admin)",
  security: [{ BearerAuth: [] }],
  responses: { 200: { description: "Audit logs" } },
});

registry.registerPath({
  method: "get",
  path: "/api/v1/admin/conversions",
  tags: ["Admin"],
  summary: "List all conversions (admin)",
  security: [{ BearerAuth: [] }],
  responses: { 200: { description: "All conversions" } },
});
