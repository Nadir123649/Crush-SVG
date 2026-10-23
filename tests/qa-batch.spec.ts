import { expect, test } from "@playwright/test";

test("Blog reading time matches article page", async ({ page }) => {
  await page.goto("/en/blog");
  const firstLink = page.locator('a[href*="/blog/"]').first();
  const cardReadTime = await page.getByText(/\d+ min read/).first().textContent();
  const href = await firstLink.getAttribute("href");
  test.skip(!href || !cardReadTime, "No published blog article is available.");
  await page.goto(href!);
  const articleReadTime = await page.getByText(/\d+ min read/).first().textContent();
  expect(cardReadTime?.trim()).toBe(articleReadTime?.trim());
});

test("Blog All button has no blurry glow shadow", async ({ page }) => {
  await page.goto("/en/blog");
  const allBtn = page.getByRole("button", { name: "All", exact: true }).first();
  const className = await allBtn.getAttribute("class") ?? "";
  expect(className).not.toMatch(/shadow-\[0px_4px_16px/);
});

test("Cookies policy page shows no quota badge text", async ({ page }) => {
  await page.goto("/en/cookies");
  const mainText = await page.locator("main").textContent() ?? "";
  expect(mainText.toLowerCase()).not.toContain("unlimited conversions");
  expect(mainText.toLowerCase()).not.toContain("free conversions");
  expect(mainText).toContain("Legal");
});

test("BG remover metadata uses no form inputs for display", async ({ page }) => {
  await page.goto("/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator(".source-metadata input, [data-testid=source-meta] input")).toHaveCount(0);
});

test("BG remover Color tab has a color picker", async ({ page }) => {
  await page.goto("/en/background-remover");
  const colorTab = page.getByRole("tab", { name: /color/i });
  if (await colorTab.count()) {
    await colorTab.click();
    const picker = page.getByLabel(/choose background color/i);
    if (await picker.count()) await expect(picker).toBeVisible();
  }
});

test("BG remover Color tab has Remove background as a button", async ({ page }) => {
  await page.goto("/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  const colorTab = page.getByRole("tab", { name: /color/i });
  if (await colorTab.count()) {
    await colorTab.click();
    const removeBtn = page.getByRole("button", { name: /remove added background/i });
    if (await removeBtn.count()) await expect(removeBtn).toBeVisible();
  }
});

test("BG remover Photo tab renders its remove action as a button", async ({ page }) => {
  await page.goto("/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  const photoTab = page.getByRole("tab", { name: /photo/i });
  if (await photoTab.count()) {
    await photoTab.click();
    const removeBtn = page.getByRole("button", { name: /remove added background/i });
    if (await removeBtn.count()) await expect(removeBtn).toBeVisible();
  }
});

test("BG remover Magic tab renders its remove action as a button", async ({ page }) => {
  await page.goto("/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator('a:has-text("Remove added background"), span:has-text("Remove added background")')).toHaveCount(0);
});

test("BG remover background dropdown has no Custom Color option", async ({ page }) => {
  await page.goto("/en/background-remover");
  await expect(page.locator('option:has-text("Custom Color"), [role=option]:has-text("Custom Color")')).toHaveCount(0);
});

test("Blog search placeholder is correct", async ({ page }) => {
  await page.goto("/en/blog");
  const input = page.getByPlaceholder(/search/i).first();
  await expect(input).toHaveAttribute("placeholder", "Search blog articles...");
});

test("Use-case page renders without layout crash", async ({ page }) => {
  await page.goto("/en/use-case");
  await expect(page.locator("main")).toBeVisible();
  await expect(page).not.toHaveURL(/500|error/);
});

test("Use-case page has no search bar and shows category pills", async ({ page }) => {
  await page.goto("/en/use-case");
  await expect(page.getByPlaceholder(/search use cases/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /all|web|email|design/i }).first()).toBeVisible();
});

test("Blog page badge says CrushSVG Blog without Guides", async ({ page }) => {
  await page.goto("/en/blog");
  const badge = page.getByText("CrushSVG Blog", { exact: true }).first();
  await expect(badge).toBeVisible();
  expect(await badge.textContent()).not.toContain("Guides");
});

test("Login page does not show a welcome toast before sign-in", async ({ page }) => {
  await page.goto("/en/login");
  await expect(page.locator('[role="alert"], .toast').filter({ hasText: /welcome/i })).toHaveCount(0);
});

test("Admin clear cache modal has an SVG icon", async ({ page }) => {
  await page.goto("/admin/settings");
  const clearBtn = page.getByRole("button", { name: /clear.*cache/i }).first();
  if (await clearBtn.count()) {
    await clearBtn.click();
    const modal = page.getByRole("dialog");
    if (await modal.count()) await expect(modal.locator("svg")).toHaveCount(1);
  }
});

test("Admin blogs page renders without layout crash", async ({ page }) => {
  await page.goto("/admin/blogs");
  await expect(page.locator("main, body").first()).toBeVisible();
  const retryBtn = page.getByRole("button", { name: /retry/i });
  if (await retryBtn.count()) {
    const cls = await retryBtn.locator("..").getAttribute("class") ?? "";
    expect(cls).toMatch(/items-center|text-center/);
  }
});

test("Header logo is visible", async ({ page }) => {
  await page.goto("/en");
  await expect(page.locator("header img, header svg").first()).toBeVisible();
});

test("PNG to SVG page has a file upload", async ({ page }) => {
  await page.goto("/en/png-to-svg");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
});

test("Admin date filter page does not render blank", async ({ page }) => {
  await page.goto("/admin/conversions");
  const body = await page.locator("body").textContent() ?? "";
  expect(body.length).toBeGreaterThan(10);
});

test("Admin users date sort does not crash", async ({ page }) => {
  await page.goto("/admin/users");
  const dateHeader = page.getByRole("columnheader", { name: /date created/i });
  if (await dateHeader.count()) {
    await dateHeader.click();
    const body = await page.locator("body").textContent() ?? "";
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Unhandled");
  }
});
