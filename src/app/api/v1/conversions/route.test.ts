import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";

mock.module("@/lib/middleware/auth-middleware", {
  namedExports: {
    auth: async () => ({ user: { id: "test-user" } }),
  },
});

mock.module("@/lib/security/rate-limit", {
  namedExports: {
    checkRateLimit: async () => ({
      allowed: true,
      retryAfterSeconds: 0,
      limit: 30,
      remaining: 29,
    }),
    rateLimitHeaders: () => ({}),
  },
});

mock.module("@/lib/database/db", {
  namedExports: {
    User: { findById: async () => ({ conversionsUsed: 5 }) },
  },
});

mock.module("@/lib/usage/quota", {
  namedExports: {
    resolveConversionQuota: () => ({
      limit: null,
      isUnlimited: true,
      isAdmin: false,
      isVerified: true,
    }),
    buildUsagePayload: () => ({
      conversionsUsed: 5,
      limit: null,
      remaining: null,
      isUnlimited: true,
      limitReached: false,
    }),
  },
});

function request(path = "") {
  return new NextRequest(`http://localhost/api/v1/conversions${path}`);
}

test("conversion history defaults missing pagination parameters", async (context) => {
  const { GET } = await import("./route");

  await context.test("missing query parameters use page 1 and limit 20", async () => {
    const response = await GET(request());
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.payload.meta.page, 1);
    assert.equal(body.payload.meta.per_page, 20);
    assert.equal(body.payload.meta.total_pages, 1);
  });

  await context.test("explicit pagination parameters are preserved", async () => {
    const response = await GET(request("?page=2&limit=5&sort=createdAt"));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.payload.meta.page, 2);
    assert.equal(body.payload.meta.per_page, 5);
  });

  await context.test("invalid pagination returns a useful 400 error", async () => {
    const response = await GET(request("?page=0"));
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.payload.error.code, "invalid_query");
    assert.match(body.payload.error.message, /page/i);
    assert.notEqual(body.payload.error.message, "");
  });
});
