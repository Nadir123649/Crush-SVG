import { expect, test } from "@playwright/test";
import sharp from "sharp";

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50" viewBox="0 0 100 50"><rect width="100" height="50" fill="#d94a1e"/></svg>';

test.describe("English homepage SEO content and converter workflow", () => {
  test("renders required copy, metadata, links, and accurate converter guidance", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle("Free SVG to PNG Converter Online | CrushSVG");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Free SVG to PNG Converter with custom dimensions and transparent backgrounds. Upload an SVG or paste code, preview your image, and download a PNG with CrushSVG.",
    );
    await expect(page.getByRole("heading", { level: 1, name: "Free Online SVG to PNG Converter" })).toBeVisible();
    await expect(page.getByText("Turn SVG files or code into PNG images for websites, presentations, email signatures, and everyday design work.", { exact: false })).toBeVisible();
    await expect(page.getByText("Try 3 free conversions without signing up.", { exact: true })).toBeVisible();

    for (const heading of [
      "Convert SVG Graphics into PNG Images You Can Use",
      "Upload a File or Paste Code",
      "Choose Your Output Size",
      "Control the Background",
      "Preview Before Downloading",
      "Start with 3 Free SVG Conversions",
      "How to Convert SVG to PNG",
      "Use Your PNG for Websites, Email, and Design Projects",
      "Website and App Assets",
      "Email Signatures and Newsletters",
      "Transparent Logos and Icons",
      "Larger Image Exports",
    ]) {
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    }

    await expect(page.getByText("The maximum output size is 8192 pixels per side.", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("The maximum output size is 4000 pixels per side.", { exact: false })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Privacy Policy", exact: true })).toHaveAttribute("href", "/privacy-policy");
    await expect(page.getByRole("link", { name: "Create a Free Account", exact: true })).toHaveAttribute("href", "/signup");

    for (const path of [
      "/use-case/svg-to-png-for-react",
      "/use-case/svg-to-png-for-email-signatures",
      "/use-case/svg-to-png-transparent-background",
      "/use-case/high-resolution-svg-to-png",
    ]) {
      expect(await page.locator(`a[href="${path}"]`).count()).toBeGreaterThan(0);
    }

    await expect(page.getByText("Convert SVG Files and Code into PNG Images", { exact: true })).toBeVisible();
    await expect(page.getByText("CrushSVG helps you export SVG artwork as PNG with custom dimensions and background options.", { exact: false })).toBeVisible();
  });

  test("accepts an SVG upload, previews pasted markup, applies custom dimensions, and downloads a PNG", async ({ page }) => {
    let conversionRequest: Record<string, unknown> | undefined;
    await page.route("**/api/v1/convert", async (route) => {
      conversionRequest = route.request().postDataJSON() as Record<string, unknown>;
      const width = Number(conversionRequest.width ?? 64);
      const height = Number(conversionRequest.height ?? Math.round(width / 2));
      const png = await sharp({
        create: { width, height, channels: 4, background: { r: 217, g: 74, b: 30, alpha: 1 } },
      }).png().toBuffer();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: png.toString("base64"),
          mimeType: "image/png",
          size: png.byteLength,
          format: "png",
          width,
          height,
          conversionsUsed: 1,
          remaining: 2,
        }),
      });
    });

    await page.goto("/");
    const editor = page.getByLabel("SVG code editor");
    await page.getByLabel("Upload SVG file").setInputFiles({ name: "homepage-check.svg", mimeType: "image/svg+xml", buffer: Buffer.from(svg) });
    await expect(editor).toHaveValue(svg);

    const livePreview = page.getByAltText("SVG preview");
    await expect(livePreview).toBeVisible();

    await editor.fill(svg);
    await expect(livePreview).toBeVisible();
    await page.getByLabel("Width in pixels or centimeters").fill("64");
    await expect(page.getByText("Choose your output width and height or adjust the scale.", { exact: false })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Convert to PNG" }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const metadata = await sharp(downloadPath!).metadata();
    expect(metadata.format).toBe("png");
    expect(metadata.width).toBe(64);
    expect(metadata.height).toBe(32);
    expect(conversionRequest).toMatchObject({ width: 64, transparent: true });
  });
});
