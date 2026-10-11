import assert from "node:assert/strict";
import test from "node:test";
import { isAllowedCorsOrigin } from "./cors-origin";

test("allows the CrushSVG Vercel preview origin", () => {
  assert.equal(
    isAllowedCorsOrigin(
      "https://crush-m3o2w62c8-nadir123649s-projects.vercel.app",
    ),
    true,
  );
});

test("does not allow arbitrary Vercel preview origins", () => {
  assert.equal(isAllowedCorsOrigin("https://other-project.vercel.app"), false);
  assert.equal(
    isAllowedCorsOrigin("http://crush-m3o2w62c8-nadir123649s-projects.vercel.app"),
    false,
  );
});

test("preserves the existing production and staging CORS origins", () => {
  assert.equal(isAllowedCorsOrigin("https://crushsvg.net"), true);
  assert.equal(isAllowedCorsOrigin("https://www.crushsvg.net"), true);
  assert.equal(isAllowedCorsOrigin("https://staging.crushsvg.net"), true);
});
