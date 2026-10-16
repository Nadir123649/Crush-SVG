import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCanonicalAdminPathname } from "./admin-routing.ts";

const locales = ["en", "es", "de", "fr", "pt", "ja"] as const;

describe("getCanonicalAdminPathname", () => {
  it("normalizes admin paths in every supported locale", () => {
    for (const locale of locales) {
      assert.equal(getCanonicalAdminPathname(`/${locale}/admin`, locales), "/admin");
      assert.equal(
        getCanonicalAdminPathname(`/${locale}/admin/blogs/123/edit`, locales),
        "/admin/blogs/123/edit"
      );
    }
  });

  it("does not match unlocalized, unsupported, or similarly named routes", () => {
    assert.equal(getCanonicalAdminPathname("/admin", locales), null);
    assert.equal(getCanonicalAdminPathname("/it/admin", locales), null);
    assert.equal(getCanonicalAdminPathname("/es/administrator", locales), null);
    assert.equal(getCanonicalAdminPathname("/es/profile", locales), null);
  });
});
