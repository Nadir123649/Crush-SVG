import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

test("OpenAPI documents the admin settings update method implemented by the API", async () => {
  const { GET } = await import("./route");
  const response = await GET(new NextRequest("http://localhost/api/openapi"));
  const document = await response.json();
  const settingsPath = document.paths["/api/v1/admin/settings"];

  assert.ok(settingsPath.patch, "PATCH is documented");
  assert.equal(settingsPath.put, undefined, "unsupported PUT is not documented");
});
