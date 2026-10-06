import { test, expect } from "@playwright/test";

test.describe("Use Cases index", () => {
  test("loads for a guest and lists use cases", async ({ page }) => {
    await page.goto("/use-case");
    await expect(page).not.toHaveURL(/login/);
    await expect(page.getByRole("link", { name: /View Use Case/ }).first()).toBeVisible();
  });

  test("navbar link is active on the index and a child page", async ({ page }) => {
    await page.goto("/use-case");
    const nav = page.getByRole("navigation").first();
    await expect(nav.getByRole("link", { name: "Use Cases" })).toHaveClass(/text-brand-primary/);
    await page.goto("/use-case/svg-to-png-for-react");
    await expect(nav.getByRole("link", { name: "Use Cases" })).toHaveClass(/text-brand-primary/);
    await expect(nav.getByRole("link", { name: "Blog" })).not.toHaveClass(/font-bold/);
  });

  test("category pill filters and All restores", async ({ page }) => {
    await page.goto("/use-case");
    const cards = page.getByRole("link", { name: /View Use Case/ });
    const total = await cards.count();
    await page.getByRole("button", { name: "Email", exact: true }).click();
    expect(await cards.count()).toBeLessThan(total);
    await page.getByRole("button", { name: "All", exact: true }).click();
    await expect(cards).toHaveCount(total);
  });

  test("no-match search shows empty state and reset restores grid", async ({ page }) => {
    await page.goto("/use-case");
    await page.getByLabel("Search use cases").fill("zzzz-no-match");
    await expect(page.getByText("No matching use cases found")).toBeVisible();
    await page.getByRole("button", { name: "Reset Filters" }).click();
    await expect(page.getByRole("link", { name: /View Use Case/ }).first()).toBeVisible();
  });

  test("card navigates to its use case page", async ({ page }) => {
    await page.goto("/use-case");
    await page.getByLabel("Search use cases").fill("react");
    await page.getByRole("link", { name: /View Use Case/ }).first().click();
    await expect(page).toHaveURL(/\/use-case\/svg-to-png-for-react$/);
  });

  test("localized route renders", async ({ page }) => {
    const res = await page.goto("/de/use-case");
    expect(res?.status()).toBe(200);
  });
});
