import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeSitemap } from "./sitemap-xml";
import type { MetadataRoute } from "next";

test("serializes sitemap entries as plain XML matching the browser tree format", () => {
  const entries: MetadataRoute.Sitemap = [
    {
      url: "https://www.example.com/",
      lastModified: new Date("2026-10-08T10:30:00.000Z"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.example.com/es",
      lastModified: "2026-10-08T00:00:00.000Z",
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const xml = serializeSitemap(entries);
  assert.doesNotMatch(xml, /<\?xml-stylesheet/);
  assert.doesNotMatch(xml, /xmlns:xhtml|hreflang|xhtml:link/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(xml, /<loc>https:\/\/www\.example\.com\/<\/loc>\s*<lastmod>2026-10-08<\/lastmod>\s*<changefreq>daily<\/changefreq>\s*<priority>1<\/priority>/);
  assert.match(xml, /<loc>https:\/\/www\.example\.com\/es<\/loc>\s*<lastmod>2026-10-08<\/lastmod>\s*<changefreq>daily<\/changefreq>\s*<priority>0\.9<\/priority>/);
});
