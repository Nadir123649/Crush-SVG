import { expect, test } from "@playwright/test";

test("header navigation fits between the logo and account controls at 80%-zoom laptop width", async ({ page }) => {
  // At 80% browser zoom, a 1024px laptop viewport has roughly 1280 CSS pixels.
  await page.setViewportSize({ width: 1280, height: 800 });

  for (const route of ["/", "/ja", "/pt", "/fr", "/de", "/es"]) {
    await page.goto(route);

    const geometry = await page.locator("header > div > div").evaluate((row) => {
      const [logo, navigation, controls] = Array.from(row.children).slice(0, 3);
      const box = (element: Element) => {
        const { left, right } = element.getBoundingClientRect();
        return { left, right };
      };

      return {
        logo: box(logo),
        navigation: box(navigation),
        controls: box(controls),
        navigationClientWidth: navigation.clientWidth,
        navigationScrollWidth: navigation.scrollWidth,
        navigationVisible: getComputedStyle(navigation).display !== "none",
      };
    });

    expect(geometry.navigationVisible, `${route}: desktop navigation is visible`).toBe(true);
    expect(geometry.logo.right, `${route}: logo and navigation do not overlap`).toBeLessThanOrEqual(
      geometry.navigation.left,
    );
    expect(geometry.navigation.right, `${route}: navigation and controls do not overlap`).toBeLessThanOrEqual(
      geometry.controls.left,
    );
    expect(
      geometry.navigationScrollWidth,
      `${route}: all navigation options fit without horizontal clipping`,
    ).toBeLessThanOrEqual(geometry.navigationClientWidth);
  }
});
