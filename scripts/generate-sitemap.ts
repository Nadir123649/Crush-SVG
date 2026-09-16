import fs from "fs";
import path from "path";
import sitemap from "../src/app/sitemap";

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

async function generateSitemapFile() {
  console.log("⚡ Generating sitemap.xml for build...");

  try {
    const entries = await sitemap();
    const publicDir = path.join(process.cwd(), "public");

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    for (const entry of entries) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(entry.url)}</loc>\n`;

      if (entry.lastModified) {
        const lastModStr =
          typeof entry.lastModified === "string"
            ? entry.lastModified
            : entry.lastModified.toISOString().split("T")[0];
        xml += `    <lastmod>${escapeXml(lastModStr)}</lastmod>\n`;
      }

      if (entry.changeFrequency) {
        xml += `    <changefreq>${escapeXml(entry.changeFrequency)}</changefreq>\n`;
      }

      if (entry.priority !== undefined) {
        xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      }

      if (entry.alternates?.languages) {
        const langs = entry.alternates.languages;
        for (const [lang, href] of Object.entries(langs)) {
          if (href) {
            xml += `    <xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(String(href))}" />\n`;
          }
        }
      }

      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    const outputPath = path.join(publicDir, "sitemap.xml");
    fs.writeFileSync(outputPath, xml, "utf8");

    console.log(`✅ Successfully generated sitemap.xml in public/ directory! (${entries.length} URLs generated)`);
  } catch (error) {
    console.error("❌ Error generating sitemap.xml:", error);
    process.exit(1);
  }
}

generateSitemapFile();
