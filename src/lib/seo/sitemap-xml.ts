import type { MetadataRoute } from "next";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastModified(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function serializeSitemap(entries: MetadataRoute.Sitemap): string {
  const urls = entries.map((entry) => {
    const fields = [
      `    <loc>${escapeXml(entry.url)}</loc>`,
      entry.lastModified
        ? `    <lastmod>${escapeXml(formatLastModified(entry.lastModified))}</lastmod>`
        : null,
      entry.changeFrequency
        ? `    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>`
        : null,
      entry.priority !== undefined
        ? `    <priority>${entry.priority}</priority>`
        : null,
      ...Object.entries(entry.alternates?.languages ?? {}).flatMap(
        ([language, href]) => typeof href === "string"
          ? [`    <xhtml:link rel="alternate" hreflang="${escapeXml(language)}" href="${escapeXml(href)}" />`]
          : [],
      ),
    ].filter((field): field is string => field !== null);

    return `  <url>\n${fields.join("\n")}\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
