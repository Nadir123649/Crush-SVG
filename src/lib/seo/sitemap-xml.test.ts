import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeSitemap } from "./sitemap-xml";
import { constructMetadata, constructLocalizedMetadata } from "../seo";
import { SITEMAP_STATIC_ROUTES } from "@/app/sitemap-routes.generated";
import type { MetadataRoute } from "next";

test("serializes sitemap entries as plain XML matching the browser tree format", () => {
  const entries: MetadataRoute.Sitemap = [
    {
      url: "https://crushsvg.net/",
      lastModified: new Date("2026-10-08T10:30:00.000Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://crushsvg.net/es",
      lastModified: "2026-10-08T00:00:00.000Z",
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const xml = serializeSitemap(entries);
  assert.doesNotMatch(xml, /<\?xml-stylesheet/);
  assert.doesNotMatch(xml, /xmlns:xhtml|hreflang|xhtml:link/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<loc>https:\/\/crushsvg\.net\/<\/loc>\s*<lastmod>2026-10-08<\/lastmod>\s*<changefreq>weekly<\/changefreq>\s*<priority>1<\/priority>/);
  assert.match(xml, /<loc>https:\/\/crushsvg\.net\/es<\/loc>\s*<lastmod>2026-10-08<\/lastmod>\s*<changefreq>weekly<\/changefreq>\s*<priority>0\.9<\/priority>/);
});

test("sitemap static routes strictly exclude all non-public, auth, and dashboard routes", () => {
  const disallowedPatterns = [
    /^\/(login|signin|signup|register)($|\/)/i,
    /^\/(forgot-password|reset-password|verify-email|email-verification|verify)($|\/)/i,
    /^\/(dashboard|account|profile|settings)($|\/)/i,
    /^\/(billing|subscription|history|my-files)($|\/)/i,
    /^\/(404|500|checkout|cancel|thank-you|offline)($|\/)/i,
    /^\/(api|admin|webhooks)($|\/)/i,
    /^\/(convert-svg-to-png|svg-to-png)($|\/)/i,
  ];

  for (const route of SITEMAP_STATIC_ROUTES) {
    for (const pattern of disallowedPatterns) {
      assert.equal(
        pattern.test(route),
        false,
        `Route "${route}" matches disallowed pattern "${pattern}" and must be excluded from sitemap!`,
      );
    }
  }
});

test("constructMetadata with noindex emits noindex, follow directive", () => {
  const meta = constructMetadata({
    title: "Test Auth Page",
    description: "Private entry point",
    noindex: true,
  });

  const robots = meta.robots as any;
  assert.equal(robots.index, false, "robots.index must be false");
  assert.equal(robots.follow, true, "robots.follow must be true for PageRank flow");
  assert.equal(robots.googleBot.index, false, "googleBot.index must be false");
  assert.equal(robots.googleBot.follow, true, "googleBot.follow must be true");
});

test("constructLocalizedMetadata with noindex emits noindex, follow directive", () => {
  const meta = constructLocalizedMetadata({
    locale: "en",
    routeKey: "/login",
    title: "Login",
    description: "Login page",
    noindex: true,
  });

  const robots = meta.robots as any;
  assert.equal(robots.index, false, "localized robots.index must be false");
  assert.equal(robots.follow, true, "localized robots.follow must be true for PageRank flow");
  assert.equal(robots.googleBot.index, false, "localized googleBot.index must be false");
  assert.equal(robots.googleBot.follow, true, "localized googleBot.follow must be true");
});
