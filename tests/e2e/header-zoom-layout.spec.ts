import { expect, test } from "@playwright/test";

test("header navigation fits on small laptop widths in every locale", async ({ page }) => {
  for (const route of ["/", "/ja", "/pt", "/fr", "/de", "/es"]) {
    await page.goto(route);

    for (const width of [1024, 1280]) {
      // A 1024px laptop at 80% browser zoom has roughly 1280 CSS pixels.
      await page.setViewportSize({ width, height: 800 });

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

      expect(geometry.navigationVisible, `${route} at ${width}px: desktop navigation is visible`).toBe(true);
      expect(geometry.logo.right, `${route} at ${width}px: logo and navigation do not overlap`).toBeLessThanOrEqual(
        geometry.navigation.left,
      );
      expect(geometry.navigation.right, `${route} at ${width}px: navigation and controls do not overlap`).toBeLessThanOrEqual(
        geometry.controls.left,
      );
      expect(
        geometry.navigationScrollWidth,
        `${route} at ${width}px: all navigation options fit without horizontal clipping`,
      ).toBeLessThanOrEqual(geometry.navigationClientWidth);
    }
  }
});

test("small screens retain access to all header links through the menu drawer", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  await expect(page.getByRole("navigation", { name: "Main Navigation" })).toBeHidden();
  await page.getByRole("button", { name: "Open menu" }).click();
  const drawer = page.locator("header > div.fixed");
  await expect(drawer.getByRole("link", { name: "Use Cases", exact: true })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Guides", exact: true })).toBeVisible();
  await expect(drawer.getByRole("link", { name: "Need Help?", exact: true })).toBeVisible();
});
