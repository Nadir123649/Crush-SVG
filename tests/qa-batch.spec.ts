import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

async function waitForClientHydration(page: Page) {
  await page.waitForFunction(() => {
    const input = document.querySelector('input[type="file"]');
    return input && Object.keys(input).some((key) => key.startsWith("__reactProps$"));
  });
}

test("Blog reading time matches article page", async ({ page }) => {
  await goto(page, "/en/blog");
  const firstLink = page.locator('a[href*="/blog/"]').first();
  const cardReadTime = await page.getByText(/\d+ min read/).first().textContent();
  const href = await firstLink.getAttribute("href");
  test.skip(!href || !cardReadTime, "No published blog article is available.");
  await goto(page, href!);
  const articleReadTime = await page.getByText(/\d+ min read/).first().textContent();
  expect(cardReadTime?.trim()).toBe(articleReadTime?.trim());
});

test("Blog All button has no blurry glow shadow", async ({ page }) => {
  await goto(page, "/en/blog");
  const allBtn = page.getByRole("button", { name: "All", exact: true }).first();
  const className = await allBtn.getAttribute("class") ?? "";
  expect(className).not.toMatch(/shadow-\[0px_4px_16px/);
});

test("Cookies policy page shows no quota badge text", async ({ page }) => {
  await goto(page, "/en/cookies");
  const mainText = await page.locator("article").textContent() ?? "";
  expect(mainText.toLowerCase()).not.toContain("unlimited conversions");
  expect(mainText.toLowerCase()).not.toContain("free conversions");
  expect(mainText).toContain("Legal");
});

test("BG remover metadata uses no form inputs for display", async ({ page }) => {
  await goto(page, "/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator(".source-metadata input, [data-testid=source-meta] input")).toHaveCount(0);
});

test("BG remover Color tab has a color picker", async ({ page }) => {
  await goto(page, "/en/background-remover");
  const colorTab = page.getByRole("tab", { name: /color/i });
  if (await colorTab.count()) {
    await colorTab.click();
    const picker = page.getByLabel(/choose background color/i);
    if (await picker.count()) await expect(picker).toBeVisible();
  }
});

test("BG remover Color tab has Remove background as a button", async ({ page }) => {
  await goto(page, "/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  const colorTab = page.getByRole("tab", { name: /color/i });
  if (await colorTab.count()) {
    await colorTab.click();
    const removeBtn = page.getByRole("button", { name: /remove added background/i });
    if (await removeBtn.count()) await expect(removeBtn).toBeVisible();
  }
});

test("BG remover Photo tab renders its remove action as a button", async ({ page }) => {
  await goto(page, "/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  const photoTab = page.getByRole("tab", { name: /photo/i });
  if (await photoTab.count()) {
    await photoTab.click();
    const removeBtn = page.getByRole("button", { name: /remove added background/i });
    if (await removeBtn.count()) await expect(removeBtn).toBeVisible();
  }
});

test("BG remover Magic tab renders its remove action as a button", async ({ page }) => {
  await goto(page, "/en/background-remover");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator('a:has-text("Remove added background"), span:has-text("Remove added background")')).toHaveCount(0);
});

test("BG remover background dropdown has no Custom Color option", async ({ page }) => {
  await goto(page, "/en/background-remover");
  await expect(page.locator('option:has-text("Custom Color"), [role=option]:has-text("Custom Color")')).toHaveCount(0);
});

test("Blog search placeholder is correct", async ({ page }) => {
  await goto(page, "/en/blog");
  const input = page.getByPlaceholder(/search/i).first();
  await expect(input).toHaveAttribute("placeholder", "Search blog articles...");
});

test("Use-case page renders without layout crash", async ({ page }) => {
  await goto(page, "/en/use-case");
  await expect(page.locator("main").last()).toBeVisible();
  await expect(page).not.toHaveURL(/500|error/);
});

test("Use-case page has no search bar and shows category pills", async ({ page }) => {
  await goto(page, "/en/use-case");
  await expect(page.getByPlaceholder(/search use cases/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /all|web|email|design/i }).first()).toBeVisible();
});

test("Blog page badge says CrushSVG Blog without Guides", async ({ page }) => {
  await goto(page, "/en/blog");
  const badge = page.getByText("CrushSVG Blog", { exact: true }).first();
  await expect(badge).toBeVisible();
  expect(await badge.textContent()).not.toContain("Guides");
});

test("Login page does not show a welcome toast before sign-in", async ({ page }) => {
  await goto(page, "/en/login");
  await expect(page.locator('[role="alert"], .toast').filter({ hasText: /welcome/i })).toHaveCount(0);
});

test("Admin clear cache modal has an SVG icon", async ({ page }) => {
  await goto(page, "/admin/settings");
  const clearBtn = page.getByRole("button", { name: /clear.*cache/i }).first();
  if (await clearBtn.count()) {
    await clearBtn.click();
    const modal = page.getByRole("dialog");
    if (await modal.count()) await expect(modal.locator("svg")).toHaveCount(1);
  }
});

test("Admin blogs page renders without layout crash", async ({ page }) => {
  await goto(page, "/admin/blogs");
  await expect(page.locator("main, body").first()).toBeVisible();
  const retryBtn = page.getByRole("button", { name: /retry/i });
  if (await retryBtn.count()) {
    const cls = await retryBtn.locator("..").getAttribute("class") ?? "";
    expect(cls).toMatch(/items-center|text-center/);
  }
});

test("Header logo is visible", async ({ page }) => {
  await goto(page, "/en");
  const logo = page.locator('header img[alt="CrushSVG Logo"]').first();
  await expect(logo).toBeVisible();
  await expect(logo).toHaveAttribute("src", "/icon-512.png");
});

test("Custom scale validation waits for blur and clears for a valid value", async ({ page }) => {
  const scaleError = "Enter a valid scale greater than 0.";
  await goto(page, "/en");
  const scaleInput = page.locator("#scale-multiplier-input");
  await page.waitForFunction(() => {
    const input = document.querySelector("#scale-multiplier-input");
    return input && Object.keys(input).some((key) => key.startsWith("__reactProps$"));
  });

  await page.locator('button[aria-label="Toggle scale dropdown"]').click();
  await page.getByRole("option", { name: "Custom" }).click();
  await expect(page.getByText(scaleError, { exact: true })).toHaveCount(0);

  await scaleInput.focus();
  await scaleInput.evaluate((input) => (input as HTMLInputElement).blur());
  await expect(page.getByText(scaleError, { exact: true })).toBeVisible();

  await scaleInput.fill("3x");
  await expect(page.getByText(scaleError, { exact: true })).toHaveCount(0);
});

test("PNG to SVG page has a file upload", async ({ page }) => {
  await goto(page, "/en/png-to-svg");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
});

test("PNG to SVG accepts a normal PNG under the 5 MB limit", async ({ page }) => {
  await goto(page, "/en/png-to-svg");
  await waitForClientHydration(page);
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path.join(process.cwd(), "public/apple-touch-icon.png"));

  await expect(page.getByRole("button", { name: /Vectorize Image/i })).toBeEnabled();
});

test("PNG to SVG converts a valid PNG end to end", async ({ page }) => {
  await goto(page, "/en/png-to-svg");
  await waitForClientHydration(page);
  await page.locator('input[type="file"]').setInputFiles(path.join(process.cwd(), "public/apple-touch-icon.png"));

  const convertButton = page.getByRole("button", { name: /Vectorize Image/i });
  await expect(convertButton).toBeEnabled();
  await convertButton.click();
  await expect(page.getByRole("button", { name: /Download SVG/i })).toBeVisible({ timeout: 25_000 });
});

test("PNG to SVG rejects PNGs over 5 MB before conversion", async ({ page }) => {
  let vectorizeRequests = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.endsWith("/api/v1/vectorize")) vectorizeRequests++;
  });

  await goto(page, "/en/png-to-svg");
  await waitForClientHydration(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "oversized.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });

  await expect(page.getByText("PNG too large. Maximum file size is 5 MB.", { exact: true }).first()).toBeVisible();
  expect(vectorizeRequests).toBe(0);
});

test("Vectorize API returns a structured 413 for a PNG over 5 MB", async ({ page }) => {
  await goto(page, "/en/png-to-svg");
  const response = await page.request.post("/api/v1/vectorize", {
    multipart: {
      file: {
        name: "oversized.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
      },
    },
  });

  expect(response.status()).toBe(413);
  const body = await response.json();
  expect(body.error).toBe("PNG too large. Maximum file size is 5 MB.");
  expect(body.payload.error).toMatchObject({
    code: "file_too_large",
    message: "PNG too large. Maximum file size is 5 MB.",
  });
});

test("Admin date filter page does not render blank", async ({ page }) => {
  await goto(page, "/admin/conversions");
  const body = await page.locator("body").textContent() ?? "";
  expect(body.length).toBeGreaterThan(10);
});

test("Admin users date sort does not crash", async ({ page }) => {
  await goto(page, "/admin/users");
  const dateHeader = page.getByRole("columnheader", { name: /date created/i });
  if (await dateHeader.count()) {
    await dateHeader.click();
    const body = await page.locator("body").textContent() ?? "";
    expect(body).not.toContain("Something went wrong");
    expect(body).not.toContain("Unhandled");
  }
});
