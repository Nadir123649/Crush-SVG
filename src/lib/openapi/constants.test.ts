import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getApiDocsRedirect } from "./constants.ts";

describe("API documentation gateway aliases", () => {
  it("redirects standard docs aliases to the production canonical page", () => {
    for (const pathname of ["/docs", "/v1/docs", "/api-docs", "/swagger"]) {
      for (const method of ["GET", "HEAD"]) {
        assert.equal(
          getApiDocsRedirect(pathname, method, "api.crushsvg.net")?.toString(),
          "https://www.crushsvg.net/api-docs",
        );
      }
    }
  });

  it("keeps staging docs on the staging frontend", () => {
    assert.equal(
      getApiDocsRedirect("/docs", "GET", "staging.api.crushsvg.net")?.toString(),
      "https://staging.crushsvg.net/api-docs",
    );
    assert.equal(
      getApiDocsRedirect("/v1/docs", "GET", "staging.api.crushsvg.net")?.toString(),
      "https://staging.crushsvg.net/api-docs",
    );
  });

  it("does not redirect unrelated paths or non-navigation methods", () => {
    assert.equal(getApiDocsRedirect("/health", "GET", "api.crushsvg.net"), null);
    assert.equal(getApiDocsRedirect("/docs", "POST", "api.crushsvg.net"), null);
    assert.equal(getApiDocsRedirect("/v1/docs", "POST", "api.crushsvg.net"), null);
  });
});
