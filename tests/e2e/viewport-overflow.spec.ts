import { test } from "@playwright/test";

const desktopLocales = ["en", "ja", "pt", "fr", "de", "es"] as const;

function routeFor(locale: (typeof desktopLocales)[number], route: string) {
  return locale === "en" ? `/${route}` : `/${locale}/${route}`;
}

const desktopRoutes = [
  ...desktopLocales.map((locale) => routeFor(locale, "svg-to-react")),
  ...desktopLocales.map((locale) => routeFor(locale, "svg-optimizer")),
  ...desktopLocales.map((locale) => routeFor(locale, "image-resizer")),
  ...desktopLocales.map((locale) => routeFor(locale, "favicon-generator")),
  ...desktopLocales.map((locale) => routeFor(locale, "background-remover")),
  ...desktopLocales.map((locale) => routeFor(locale, "png-to-svg")),
];

const mobileRoutes = [
  ...desktopLocales.map((locale) => routeFor(locale, "svg-to-react")),
  routeFor("pt", "image-resizer"),
  routeFor("fr", "image-resizer"),
  routeFor("es", "image-resizer"),
  routeFor("pt", "png-to-svg"),
  routeFor("pt", "convert-svg-to-png"),
];

test("reported tool pages have no document-level horizontal overflow", async ({ page }, testInfo) => {
  // The viewport matrix is explicit below; running this once avoids duplicate
  // navigation from Playwright's generic desktop/mobile projects.
  test.skip(testInfo.project.name !== "desktop", "The test controls its exact viewport sizes.");
  test.setTimeout(300_000);

  const failures: string[] = [];

  for (const [width, height, routes] of [
    [1280, 800, desktopRoutes],
    [375, 812, mobileRoutes],
  ] as const) {
    await page.setViewportSize({ width, height });

    for (const route of routes) {
      try {
        const response = await page.goto(route, { waitUntil: "domcontentloaded" });
        if (!response || response.status() >= 400) {
          failures.push(`${route} at ${width}px returned HTTP ${response?.status() ?? "no response"}`);
          continue;
        }

        await page.waitForTimeout(150);
        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));

        if (dimensions.scrollWidth > dimensions.clientWidth) {
          failures.push(
            `${route} at ${width}px: scrollWidth ${dimensions.scrollWidth} > clientWidth ${dimensions.clientWidth}`,
          );
        }
      } catch (error) {
        failures.push(`${route} at ${width}px failed to load: ${String(error)}`);
      }
    }
  }

  if (failures.length) {
    throw new Error(`Viewport overflow regression failures:\n${failures.join("\n")}`);
  }
});
