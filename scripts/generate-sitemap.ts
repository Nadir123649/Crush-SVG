import fs from "fs";
import path from "path";
import sitemap from "../src/app/sitemap";

async function generateSitemapFile() {
  console.log("⚡ Generating sitemap.xml for build...");

  try {
    const response = await sitemap();
    const xml = await response.text();
    const publicDir = path.join(process.cwd(), "public");

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, "sitemap.xml");
    fs.writeFileSync(outputPath, xml, "utf8");

    console.log(`✅ Successfully generated sitemap.xml in public/ directory!`);
  } catch (error) {
    console.error("❌ Error generating sitemap.xml:", error);
    process.exit(1);
  }
}

generateSitemapFile();
