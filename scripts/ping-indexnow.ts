import { SITE_URL } from "../src/lib/seo";

const INDEXNOW_KEY = "68434d213b77fa63ae8ffaa76729dcee";

function decodeXml(value: string): string {
  return value.replace(/&(?:lt|gt|quot|apos|amp);/g, (entity) => {
    switch (entity) {
      case "&lt;":
        return "<";
      case "&gt;":
        return ">";
      case "&quot;":
        return '"';
      case "&apos;":
        return "'";
      case "&amp;":
        return "&";
      default:
        return entity;
    }
  });
}

async function pingIndexNow() {
  console.log("⚡ Pinging IndexNow for instant search engine indexing (Bing, Yandex, Naver)...");

  try {
    const sitemapUrl = `${SITE_URL || "https://www.crushsvg.net"}/sitemap.xml`;
    const sitemapResponse = await fetch(sitemapUrl);
    if (!sitemapResponse.ok) {
      throw new Error(`Failed to read sitemap (${sitemapResponse.status})`);
    }
    const xml = await sitemapResponse.text();
    const urlList = Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g), ([, loc]) =>
      decodeXml(loc.trim())
    );
    if (urlList.length === 0) {
      throw new Error("Sitemap contains no URLs");
    }

    const host = new URL(sitemapUrl).hostname;

    const payload = {
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    };

    const response = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 202 || response.status === 200) {
      console.log(`✅ Successfully submitted ${urlList.length} URLs to IndexNow (HTTP ${response.status})`);
    } else if (response.status === 403) {
      console.log(`ℹ️ IndexNow verification pending: Verification file is live at ${SITE_URL}/${INDEXNOW_KEY}.txt`);
      console.log("   IndexNow ping will activate automatically after Vercel production deployment.");
    } else {
      console.warn(`⚠️ IndexNow response HTTP status: ${response.status}`);
      const text = await response.text();
      console.warn("Response body:", text);
    }
  } catch (error) {
    console.error("ℹ️ Note: IndexNow ping skipped during offline/local build environment:", error);
  }
}

pingIndexNow();
