import fs from "fs";
import path from "path";
import sitemap from "../src/app/sitemap";

async function generateSitemapFile() {
  console.log("⚡ Generating sitemap.xml for build...");

  try {
    const response = await sitemap();
    if (!response.ok) {
      throw new Error(`Sitemap generation returned HTTP ${response.status}`);
    }

    const xml = await response.text();
    const publicDir = path.join(process.cwd(), "public");

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, "sitemap.xml");
    fs.writeFileSync(outputPath, xml, "utf8");

    const urlCount = (xml.match(/<url>/g) ?? []).length;
    console.log(`✅ Successfully generated sitemap.xml in public/ directory! (${urlCount} URLs generated)`);
  } catch (error) {
    console.error("❌ Error generating sitemap.xml:", error);
    process.exit(1);
  }
}

generateSitemapFile();
