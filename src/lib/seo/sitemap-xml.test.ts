import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeSitemap } from "./sitemap-xml";
import {
  getSitemapLanguageAlternates,
  SITEMAP_INDEXABLE_STATIC_ROUTES,
} from "./sitemap-routes";
import { constructMetadata, constructLocalizedMetadata, SITE_URL } from "../seo";
import { SITEMAP_STATIC_ROUTES } from "@/app/sitemap-routes.generated";
import type { MetadataRoute } from "next";

test("serializes sitemap entries as plain XML matching the browser tree format", () => {
  const entries: MetadataRoute.Sitemap = [
    {
      url: "https://www.crushsvg.net/",
      alternates: {
        languages: {
          en: "https://www.crushsvg.net/",
          es: "https://www.crushsvg.net/es",
          "x-default": "https://www.crushsvg.net/",
        },
      },
      lastModified: new Date("2026-10-08T10:30:00.000Z"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.crushsvg.net/es",
      lastModified: "2026-10-08T00:00:00.000Z",
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const xml = serializeSitemap(entries);
  assert.doesNotMatch(xml, /<\?xml-stylesheet/);
  assert.match(xml, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.match(xml, /<loc>https:\/\/www\.crushsvg\.net\/<\/loc>\s*<xhtml:link rel="alternate" hreflang="en" href="https:\/\/www\.crushsvg\.net\/" \/>/);
  assert.match(xml, /hreflang="x-default" href="https:\/\/www\.crushsvg\.net\/"/);
  assert.match(xml, /<lastmod>2026-10-08<\/lastmod>\s*<changefreq>weekly<\/changefreq>\s*<priority>1<\/priority>/);
  assert.match(xml, /<loc>https:\/\/www\.crushsvg\.net\/es<\/loc>\s*<lastmod>2026-10-08<\/lastmod>\s*<changefreq>weekly<\/changefreq>\s*<priority>0\.9<\/priority>/);
});

test("sitemap language alternates use the configured localized route slugs", () => {
  const toolAlternates = getSitemapLanguageAlternates(
    "/png-to-svg",
    SITE_URL,
  );
  assert.deepEqual(toolAlternates, {
    en: "https://www.crushsvg.net/png-to-svg",
    es: "https://www.crushsvg.net/es/convertir-png-a-svg",
    de: "https://www.crushsvg.net/de/png-in-svg-umwandeln",
    fr: "https://www.crushsvg.net/fr/convertir-png-en-svg",
    pt: "https://www.crushsvg.net/pt/converter-png-para-svg",
    ja: "https://www.crushsvg.net/ja/png-svg-henkan",
    "x-default": "https://www.crushsvg.net/png-to-svg",
  });

  const blogAlternates = getSitemapLanguageAlternates(
    "/blog/example-post",
    SITE_URL,
  );
  assert.equal(blogAlternates.es, "https://www.crushsvg.net/es/blog/example-post");
  assert.equal(blogAlternates.ja, "https://www.crushsvg.net/ja/blog/example-post");
});

test("public metadata uses the active production host", () => {
  const metadata = constructMetadata({
    title: "CrushSVG",
    description: "Test page",
    canonicalPath: "/",
  });
  const localizedMetadata = constructLocalizedMetadata({
    locale: "en",
    routeKey: "/",
    title: "CrushSVG",
    description: "Test page",
  });

  assert.equal(SITE_URL, "https://www.crushsvg.net");
  assert.equal(metadata.alternates?.canonical, "https://www.crushsvg.net/");
  assert.equal(localizedMetadata.alternates?.canonical, "https://www.crushsvg.net/");
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

test("sitemap keeps high-value public pages and omits utility and legal pages", () => {
  for (const route of [
    "/",
    "/about",
    "/background-remover",
    "/blog",
    "/compare/crushsvg-vs-vectorizer-ai",
    "/favicon-generator",
    "/help",
    "/image-resizer",
    "/png-to-svg",
    "/svg-guides",
    "/svg-optimizer",
    "/svg-to-react",
    "/use-case",
  ]) {
    assert.ok(SITEMAP_INDEXABLE_STATIC_ROUTES.has(route), `Expected ${route} in sitemap`);
  }

  for (const route of [
    "/changelog",
    "/contact-us",
    "/cookies",
    "/privacy-policy",
    "/support",
    "/team",
    "/terms",
  ]) {
    assert.ok(SITEMAP_STATIC_ROUTES.includes(route as (typeof SITEMAP_STATIC_ROUTES)[number]));
    assert.equal(SITEMAP_INDEXABLE_STATIC_ROUTES.has(route), false, `Unexpected ${route} in sitemap`);
  }
});

test("constructMetadata with noindex emits noindex, follow directive", () => {
  const meta = constructMetadata({
    title: "Test Auth Page",
    description: "Private entry point",
    noindex: true,
  });

  assert.ok(meta.robots && typeof meta.robots === "object");
  const robots = meta.robots;
  assert.equal(robots.index, false, "robots.index must be false");
  assert.equal(robots.follow, true, "robots.follow must be true for PageRank flow");
  assert.ok(robots.googleBot && typeof robots.googleBot === "object");
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

  assert.ok(meta.robots && typeof meta.robots === "object");
  const robots = meta.robots;
  assert.equal(robots.index, false, "localized robots.index must be false");
  assert.equal(robots.follow, true, "localized robots.follow must be true for PageRank flow");
  assert.ok(robots.googleBot && typeof robots.googleBot === "object");
  assert.equal(robots.googleBot.index, false, "localized googleBot.index must be false");
  assert.equal(robots.googleBot.follow, true, "localized googleBot.follow must be true");
});
