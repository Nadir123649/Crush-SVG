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
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString().slice(0, 10);
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
    ].filter((field): field is string => field !== null);

    return `  <url>\n${fields.join("\n")}\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
