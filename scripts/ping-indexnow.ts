import sitemap from "../src/app/sitemap";
import { SITE_URL } from "../src/lib/seo";

const INDEXNOW_KEY = "68434d213b77fa63ae8ffaa76729dcee";

async function pingIndexNow() {
  console.log("⚡ Pinging IndexNow for instant search engine indexing (Bing, Yandex, Naver)...");

  try {
    const entries = await sitemap();
    const urlList = entries.map((entry) => entry.url);
    const host = new URL(SITE_URL || "https://www.crushsvg.net").hostname;

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
    } else {
      console.warn(`⚠️ IndexNow response HTTP status: ${response.status}`);
      const text = await response.text();
      console.warn("Response body:", text);
    }
  } catch (error) {
    console.error("❌ Error submitting to IndexNow:", error);
  }
}

pingIndexNow();
