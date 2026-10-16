import assert from "node:assert/strict";
import { mock, test } from "node:test";
import { NextRequest } from "next/server";

mock.module("server-only", { namedExports: {} });

type DeleteResult = { deletedCount: number };

let userRecord: { role: "admin" | "user"; email: string } = {
  role: "user",
  email: "user@example.test",
};
let blogRecord: { _id: string; slug: string; title: string } = {
  _id: "blog-id",
  slug: "test-post",
  title: "Test post",
};
let userDeleteResult: DeleteResult | Error = { deletedCount: 1 };
let blogDeleteResult: DeleteResult | Error = { deletedCount: 1 };
let adminCount = 2;
let userDeleteCalls = 0;
let auditEvents: unknown[] = [];

mock.module("@/lib/database/db", {
  namedExports: {
    User: {
      findOne: async () => userRecord,
      countDocuments: async () => adminCount,
      deleteOne: async () => {
        userDeleteCalls += 1;
        if (userDeleteResult instanceof Error) throw userDeleteResult;
        return userDeleteResult;
      },
    },
    Blog: {
      findById: async () => blogRecord,
      deleteOne: async () => {
        if (blogDeleteResult instanceof Error) throw blogDeleteResult;
        return blogDeleteResult;
      },
    },
    AuditLog: {
      create: async (event: unknown) => {
        auditEvents.push(event);
      },
    },
    isDuplicateKeyError: () => false,
  },
});

mock.module("@/lib/middleware/admin-middleware", {
  namedExports: {
    requireAdmin: async () => ({ user: { id: "admin-id" } }),
  },
});

mock.module("@/lib/security/rate-limit", {
  namedExports: {
    checkRateLimit: async () => ({
      allowed: true,
      retryAfterSeconds: 0,
      limit: 10,
      remaining: 9,
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
    toUserDTO: (user: unknown) => user,
  },
});

mock.module("@/lib/auth/roles", {
  namedExports: {
    isVerifiedProfile: () => true,
  },
});

function makeRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost${path}`, { method: "DELETE" });
}

function resetMocks() {
  userRecord = { role: "user", email: "user@example.test" };
  blogRecord = { _id: "blog-id", slug: "test-post", title: "Test post" };
  userDeleteResult = { deletedCount: 1 };
  blogDeleteResult = { deletedCount: 1 };
  adminCount = 2;
  userDeleteCalls = 0;
  auditEvents = [];
}

test("admin user and blog delete endpoints report only completed deletions", async (context) => {
  const [{ DELETE: deleteUser }, { DELETE: deleteBlog }] = await Promise.all([
    import("./users/[uid]/route"),
    import("./blogs/[id]/route"),
  ]);

  await context.test("user deletion succeeds and writes its audit event", async () => {
    resetMocks();
    const response = await deleteUser(makeRequest("/api/v1/admin/users/user-id"), {
      params: Promise.resolve({ uid: "user-id" }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.payload.deleted, true);
    assert.equal(auditEvents.length, 1);
  });

  await context.test("user zero-count deletion returns not found without auditing", async () => {
    resetMocks();
    userDeleteResult = { deletedCount: 0 };
    const response = await deleteUser(makeRequest("/api/v1/admin/users/user-id"), {
      params: Promise.resolve({ uid: "user-id" }),
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.payload.error.code, "not_found");
    assert.equal(auditEvents.length, 0);
  });

  await context.test("user database errors do not report success or write an audit event", async () => {
    resetMocks();
    const databaseError = new Error("database unavailable");
    userDeleteResult = databaseError;

    await assert.rejects(
      deleteUser(makeRequest("/api/v1/admin/users/user-id"), {
        params: Promise.resolve({ uid: "user-id" }),
      }),
      databaseError,
    );
    assert.equal(auditEvents.length, 0);
  });

  await context.test("last-admin safeguard prevents deletion", async () => {
    resetMocks();
    userRecord = { role: "admin", email: "admin@example.test" };
    adminCount = 1;
    const response = await deleteUser(makeRequest("/api/v1/admin/users/admin-id"), {
      params: Promise.resolve({ uid: "admin-id" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.payload.error.message, "Cannot delete the last admin user");
    assert.equal(userDeleteCalls, 0);
    assert.equal(auditEvents.length, 0);
  });

  await context.test("blog deletion succeeds and writes its audit event", async () => {
    resetMocks();
    const response = await deleteBlog(makeRequest("/api/v1/admin/blogs/blog-id"), {
      params: Promise.resolve({ id: "blog-id" }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.payload.deleted, true);
    assert.equal(auditEvents.length, 1);
  });

  await context.test("blog zero-count deletion returns not found without auditing", async () => {
    resetMocks();
    blogDeleteResult = { deletedCount: 0 };
    const response = await deleteBlog(makeRequest("/api/v1/admin/blogs/blog-id"), {
      params: Promise.resolve({ id: "blog-id" }),
    });
    const body = await response.json();

    assert.equal(response.status, 404);
    assert.equal(body.payload.error.code, "not_found");
    assert.equal(auditEvents.length, 0);
  });

  await context.test("blog database errors do not report success or write an audit event", async () => {
    resetMocks();
    const databaseError = new Error("database unavailable");
    blogDeleteResult = databaseError;

    await assert.rejects(
      deleteBlog(makeRequest("/api/v1/admin/blogs/blog-id"), {
        params: Promise.resolve({ id: "blog-id" }),
      }),
      databaseError,
    );
    assert.equal(auditEvents.length, 0);
  });
});
