const BASE = "http://localhost:3008";

const testRoutes = [
  // Homepage & Localized Tools
  { path: "/", expectedLang: "en" },
  { path: "/es/convertir-svg-a-png", expectedLang: "es" },
  { path: "/de/svg-in-png-umwandeln", expectedLang: "de" },
  { path: "/fr/convertir-svg-en-png", expectedLang: "fr" },
  { path: "/pt/converter-svg-em-png", expectedLang: "pt" },
  { path: "/ja/svg-png-henkan", expectedLang: "ja" },

  // Secondary Tools
  { path: "/background-remover", expectedLang: "en" },
  { path: "/es/background-remover", expectedLang: "es" },
  { path: "/image-resizer", expectedLang: "en" },
  { path: "/de/image-resizer", expectedLang: "de" },

  // Content Pages
  { path: "/about", expectedLang: "en" },
  { path: "/es/about", expectedLang: "es" },
  { path: "/team", expectedLang: "en" },
  { path: "/de/team", expectedLang: "de" },
  { path: "/contact-us", expectedLang: "en" },
  { path: "/fr/contact-us", expectedLang: "fr" },
  { path: "/privacy-policy", expectedLang: "en" },
  { path: "/pt/privacy-policy", expectedLang: "pt" },
  { path: "/terms", expectedLang: "en" },
  { path: "/ja/terms", expectedLang: "ja" },
  { path: "/cookies", expectedLang: "en" },
  { path: "/es/cookies", expectedLang: "es" },
  { path: "/changelog", expectedLang: "en" },
  { path: "/de/changelog", expectedLang: "de" },
  { path: "/help", expectedLang: "en" },
  { path: "/fr/help", expectedLang: "fr" },
  { path: "/support", expectedLang: "en" },
  { path: "/pt/support", expectedLang: "pt" },
  { path: "/svg-guides", expectedLang: "en" },
  { path: "/ja/svg-guides", expectedLang: "ja" },

  // Blog & Dynamic
  { path: "/blog", expectedLang: "en" },
  { path: "/es/blog", expectedLang: "es" },
  { path: "/ja/blog", expectedLang: "ja" },
  { path: "/blog/fix-broken-email-images-outlook-gmail", expectedLang: "en" },
  { path: "/es/blog/fix-broken-email-images-outlook-gmail", expectedLang: "es" },
  { path: "/use-case/svg-to-png-for-react", expectedLang: "en" },
  { path: "/de/use-case/svg-to-png-for-react", expectedLang: "de" },

  // Auth Pages
  { path: "/login", expectedLang: "en" },
  { path: "/es/login", expectedLang: "es" },
  { path: "/signup", expectedLang: "en" },
  { path: "/de/signup", expectedLang: "de" },
  { path: "/forgot-password", expectedLang: "en" },
  { path: "/fr/forgot-password", expectedLang: "fr" },
  { path: "/reset-password", expectedLang: "en" },
  { path: "/ja/reset-password", expectedLang: "ja" }
];

async function run() {
  console.log("=== STARTING FULL ROUTE VERIFICATION ===");
  let passed = 0;
  let failed = 0;

  for (const route of testRoutes) {
    try {
      const res = await fetch(BASE + route.path, { redirect: "manual" });
      const status = res.status;
      const html = await res.text();

      // Check lang attribute
      const hasCorrectLang = html.includes(`lang="${route.expectedLang}"`);
      // Check for hreflang alternates
      const hasHreflangEn = html.includes('hreflang="en"');
      const hasHreflangEs = html.includes('hreflang="es"');
      const hasHreflangJa = html.includes('hreflang="ja"');

      if (status === 200 && hasCorrectLang) {
        console.log(`[PASS] ${route.path.padEnd(50)} Status: ${status} | lang="${route.expectedLang}"`);
        passed++;
      } else {
        console.error(`[FAIL] ${route.path.padEnd(50)} Status: ${status} | expectedLang: ${route.expectedLang} | hasCorrectLang: ${hasCorrectLang}`);
        failed++;
      }
    } catch (e) {
      console.error(`[ERR]  ${route.path.padEnd(50)} ${e.message}`);
      failed++;
    }
  }

  // Check Sitemap
  console.log("\n=== VERIFYING SITEMAP.XML ===");
  try {
    const sitemapRes = await fetch(BASE + "/sitemap.xml");
    const sitemapXml = await sitemapRes.text();
    const hasSitemapEntries = sitemapXml.includes("<url>") && sitemapXml.includes("xhtml:link");
    const countHreflangs = (sitemapXml.match(/hreflang="/g) || []).length;
    console.log(`[PASS] /sitemap.xml status: ${sitemapRes.status} | has alternates: ${hasSitemapEntries} | hreflang tag count: ${countHreflangs}`);
    if (sitemapRes.status === 200 && countHreflangs > 100) {
      passed++;
    } else {
      failed++;
    }
  } catch (e) {
    console.error(`[ERR] /sitemap.xml ${e.message}`);
    failed++;
  }

  console.log(`\n=== SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

run();
