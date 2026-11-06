import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";

mock.module("server-only", { namedExports: {} });
mock.module("@/lib/security/ip", {
  namedExports: { getClientIp: () => "192.0.2.1" },
});

let count = 1;
mock.module("@/lib/security/rate-store", {
  namedExports: {
    getRateStore: () => ({
      increment: async () => count,
      ttlMs: async () => 2_000,
    }),
  },
});

test("rate limit headers include a reset timestamp when a request is blocked", async () => {
  const { checkRateLimit, rateLimitHeaders } = await import("./rate-limit");
  const request = new NextRequest("http://localhost/api/test");
  const before = Math.ceil(Date.now() / 1000);
  count = 3;

  const result = await checkRateLimit(request, "test", 2, 60_000);
  const headers = rateLimitHeaders(result);

  assert.equal(result.allowed, false);
  assert.equal(headers["X-RateLimit-Limit"], "2");
  assert.equal(headers["X-RateLimit-Remaining"], "0");
  assert.equal(headers["Retry-After"], "2");
  assert.equal(Number(headers["X-RateLimit-Reset"]), before + 2);
});

test("successful requests do not trigger a misleading reset time", async () => {
  const { checkRateLimit, rateLimitHeaders } = await import("./rate-limit");
  const request = new NextRequest("http://localhost/api/test");
  count = 1;

  const result = await checkRateLimit(request, "test", 2, 60_000);
  const headers = rateLimitHeaders(result);

  assert.equal(result.allowed, true);
  assert.equal(headers["X-RateLimit-Remaining"], "1");
  assert.equal(headers["X-RateLimit-Reset"], undefined);
});
