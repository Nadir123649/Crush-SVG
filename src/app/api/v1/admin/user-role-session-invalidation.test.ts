import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";

type UserRole = "admin" | "user";

let user: {
  _id: string;
  uid: string;
  role: UserRole;
  email: string;
  isVerified: boolean;
  providers: string[];
  displayName: string;
  save: () => Promise<void>;
} = createUser();
let adminCount = 2;
let saveError: Error | null = null;
let verified = true;
let saveCalls = 0;
let sessionRevocations: Array<{ userId: string; status: string }> = [];
let cacheInvalidations = 0;
let events: string[] = [];
let auditEvents: unknown[] = [];

function createUser(role: UserRole = "user") {
  return {
    _id: "target-user-id",
    uid: "target-user",
    role,
    email: "target@example.test",
    isVerified: true,
    providers: ["google"],
    displayName: "Target User",
    save: async () => {
      saveCalls += 1;
      events.push("save");
      if (saveError) throw saveError;
    },
  };
}

mock.module("@/lib/database/db", {
  namedExports: {
    User: {
      findOne: async () => user,
      countDocuments: async () => adminCount,
    },
    AuditLog: {
      create: async (event: unknown) => {
        auditEvents.push(event);
      },
    },
  },
});

mock.module("@/lib/middleware/admin-middleware", {
  namedExports: {
    requireAdmin: async () => ({ user: { id: "acting-admin-id" } }),
  },
});

mock.module("@/lib/security/rate-limit", {
  namedExports: {
    checkRateLimit: async () => ({
      allowed: true,
      retryAfterSeconds: 0,
      limit: 20,
      remaining: 19,
    }),
    rateLimitHeaders: () => ({}),
  },
});

mock.module("@/lib/security/ip", {
  namedExports: {
    getClientIp: () => "127.0.0.1",
  },
});

mock.module("@/lib/auth/auth", {
  namedExports: {
    toUserDTO: (record: unknown) => record,
  },
});

mock.module("@/lib/auth/roles", {
  namedExports: {
    isVerifiedProfile: () => verified,
  },
});

mock.module("@/lib/auth/sessions", {
  namedExports: {
    revokeAllSessions: async (userId: string, status: string) => {
      events.push("revoke");
      sessionRevocations.push({ userId, status });
    },
  },
});

mock.module("@/lib/middleware/auth-middleware", {
  namedExports: {
    invalidateSessionCache: async () => {
      events.push("invalidate-cache");
      cacheInvalidations += 1;
    },
  },
});

function resetMocks(role: UserRole = "user") {
  user = createUser(role);
  adminCount = 2;
  saveError = null;
  verified = true;
  saveCalls = 0;
  sessionRevocations = [];
  cacheInvalidations = 0;
  events = [];
  auditEvents = [];
}

function makeRequest(role?: string): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/users/target-user", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(role === undefined ? {} : { role }),
  });
}

test("admin role changes revoke active sessions only after a successful role change", async (context) => {
  const { PATCH } = await import("./users/[uid]/route");

  await context.test("promotion revokes sessions and invalidates cache after save", async () => {
    resetMocks("user");
    const response = await PATCH(makeRequest("admin"), {
      params: Promise.resolve({ uid: "target-user" }),
    });

    assert.equal(response.status, 200);
    assert.equal(user.role, "admin");
    assert.equal(saveCalls, 1);
    assert.deepEqual(sessionRevocations, [{ userId: "target-user-id", status: "revoked" }]);
    assert.equal(cacheInvalidations, 1);
    assert.deepEqual(events, ["save", "revoke", "invalidate-cache"]);
    assert.equal(auditEvents.length, 1);
  });

  await context.test("demotion revokes sessions and invalidates cache after save", async () => {
    resetMocks("admin");
    const response = await PATCH(makeRequest("user"), {
      params: Promise.resolve({ uid: "target-user" }),
    });

    assert.equal(response.status, 200);
    assert.equal(user.role, "user");
    assert.deepEqual(sessionRevocations, [{ userId: "target-user-id", status: "revoked" }]);
    assert.equal(cacheInvalidations, 1);
    assert.deepEqual(events, ["save", "revoke", "invalidate-cache"]);
  });

  await context.test("unchanged role does not revoke sessions or invalidate cache", async () => {
    resetMocks("user");
    const response = await PATCH(makeRequest("user"), {
      params: Promise.resolve({ uid: "target-user" }),
    });

    assert.equal(response.status, 200);
    assert.equal(saveCalls, 1);
    assert.deepEqual(sessionRevocations, []);
    assert.equal(cacheInvalidations, 0);
    assert.deepEqual(events, ["save"]);
    assert.equal(auditEvents.length, 1);
  });

  await context.test("unverified user promotion remains blocked without session invalidation", async () => {
    resetMocks("user");
    verified = false;
    const response = await PATCH(makeRequest("admin"), {
      params: Promise.resolve({ uid: "target-user" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.payload.error.code, "unverified_user");
    assert.equal(saveCalls, 0);
    assert.deepEqual(sessionRevocations, []);
    assert.equal(cacheInvalidations, 0);
    assert.equal(auditEvents.length, 0);
  });

  await context.test("last admin demotion remains blocked without session invalidation", async () => {
    resetMocks("admin");
    adminCount = 1;
    const response = await PATCH(makeRequest("user"), {
      params: Promise.resolve({ uid: "target-user" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.payload.error.code, "bad_request");
    assert.equal(saveCalls, 0);
    assert.deepEqual(sessionRevocations, []);
    assert.equal(cacheInvalidations, 0);
    assert.equal(auditEvents.length, 0);
  });

  await context.test("failed save does not revoke sessions or invalidate cache", async () => {
    resetMocks("user");
    saveError = new Error("save failed");

    await assert.rejects(
      PATCH(makeRequest("admin"), {
        params: Promise.resolve({ uid: "target-user" }),
      }),
      saveError,
    );

    assert.equal(saveCalls, 1);
    assert.deepEqual(sessionRevocations, []);
    assert.equal(cacheInvalidations, 0);
    assert.deepEqual(events, ["save"]);
    assert.equal(auditEvents.length, 0);
  });
});
