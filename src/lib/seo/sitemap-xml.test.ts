import { test } from "node:test";
import assert from "node:assert/strict";
import { serializeSitemap } from "./sitemap-xml";
import type { MetadataRoute } from "next";

test("serializes sitemap entries as well-formed XML with a browser stylesheet", () => {
  const entries: MetadataRoute.Sitemap = [{
    url: "https://example.com/a?x=1&y=2",
    lastModified: new Date("2026-10-09T00:00:00.000Z"),
    changeFrequency: "weekly",
    priority: 0.8,
    alternates: {
      languages: {
        en: "https://example.com/a?x=1&y=2",
        "x-default": "https://example.com/a?x=1&y=2",
      },
    },
  }];

  const xml = serializeSitemap(entries);
  assert.match(xml, /<\?xml-stylesheet type="text\/xsl" href="\/sitemap\.xsl"\?>/);
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"/);
  assert.match(xml, /<loc>https:\/\/example\.com\/a\?x=1&amp;y=2<\/loc>/);
  assert.match(xml, /<lastmod>2026-10-09T00:00:00\.000Z<\/lastmod>/);
  assert.match(xml, /<changefreq>weekly<\/changefreq>/);
  assert.match(xml, /<priority>0\.8<\/priority>/);
  assert.match(xml, /hreflang="x-default" href="https:\/\/example\.com\/a\?x=1&amp;y=2"/);
});
