const routes = [
  "/",
  "/es/convertir-svg-a-png",
  "/de/svg-in-png-umwandeln",
  "/fr/convertir-svg-en-png",
  "/pt/converter-svg-em-png",
  "/ja/svg-png-henkan",
  "/ja/png-svg-henkan",
  "/es/about",
  "/de/team",
  "/fr/contact-us",
  "/pt/blog",
  "/ja/svg-guides",
  "/es/help",
  "/de/support",
  "/sitemap.xml"
];

async function testAll() {
  console.log("Testing dev server routes...");
  for (const r of routes) {
    try {
      const res = await fetch("http://localhost:3000" + r);
      console.log(`[${res.status}] ${r}`);
    } catch (e) {
      console.log(`[ERR] ${r}: ${e.message}`);
    }
  }
}

testAll();
