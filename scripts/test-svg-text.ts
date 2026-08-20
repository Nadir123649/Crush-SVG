import "./mock-server-only";
import assert from "node:assert";
import sharp from "sharp";
import { convertSvg } from "../src/lib/svg/svg-convert";
import { sanitizeSvg } from "../src/lib/svg/svg-sanitize";

async function countForegroundPixels(
  buffer: Buffer,
  bgCheck: (r: number, g: number, b: number, a: number) => boolean
): Promise<number> {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = info.channels === 4 ? data[i + 3] : 255;
    if (!bgCheck(r, g, b, a)) {
      count++;
    }
  }
  return count;
}

async function runAllTests() {
  console.log("=== Starting SVG Text & Conversion Verification Tests ===");

  // 1. Mandatory Test: THE NEVON SVG reproduction
  console.log("\n[Test 1] THE NEVON Original SVG");
  const nevonSvg = `<svg width="400" height="400" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#111827"/><circle cx="200" cy="160" r="80" fill="#3B82F6"/><rect x="110" y="260" width="180" height="60" rx="16" fill="#22C55E"/><text x="200" y="298" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-size="24" font-weight="700" fill="#FFFFFF">THE NEVON</text></svg>`;
  
  const nevonResult = await convertSvg(nevonSvg, { scale: 1 });
  assert.strictEqual(nevonResult.format, "png");
  assert.strictEqual(nevonResult.width, 400);
  assert.strictEqual(nevonResult.height, 400);

  // Inspect pixels inside the green rounded rectangle region (x: 110-290, y: 260-320)
  const { data: rawData, info: rawInfo } = await sharp(nevonResult.buffer).raw().toBuffer({ resolveWithObject: true });
  let whiteTextPixels = 0;
  let greenBgPixels = 0;
  for (let y = 260; y < 320; y++) {
    for (let x = 110; x < 290; x++) {
      const idx = (y * rawInfo.width + x) * rawInfo.channels;
      const r = rawData[idx];
      const g = rawData[idx + 1];
      const b = rawData[idx + 2];
      if (r > 200 && g > 200 && b > 200) {
        whiteTextPixels++;
      } else if (g > 150 && r < 100 && b < 150) {
        greenBgPixels++;
      }
    }
  }
  console.log(`- White text pixels ("THE NEVON"): ${whiteTextPixels}`);
  console.log(`- Green button pixels: ${greenBgPixels}`);
  assert(whiteTextPixels > 100, `Expected white text pixels > 100, got ${whiteTextPixels}`);
  assert(greenBgPixels > 5000, `Expected green button pixels > 5000, got ${greenBgPixels}`);
  console.log("✓ PASS: THE NEVON rendered with visible white text on green button");

  // 2. Minimum Test Matrix: Basic text
  console.log("\n[Test 2] Basic Text");
  const basicSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="black"/><text x="20" y="50" fill="white" font-size="24">Hello SVG</text></svg>`;
  const basicRes = await convertSvg(basicSvg, { scale: 1 });
  const basicTextPixels = await countForegroundPixels(basicRes.buffer, (r, g, b) => r === 0 && g === 0 && b === 0);
  console.log(`- Foreground pixels: ${basicTextPixels}`);
  assert(basicTextPixels > 50, "Basic text must have visible pixels");
  console.log("✓ PASS: Basic text rendered");

  // 3. Minimum Test Matrix: Font family
  console.log("\n[Test 3] Font Family (Arial)");
  const fontFamSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="black"/><text x="20" y="50" fill="white" font-size="24" font-family="Arial">Arial Test</text></svg>`;
  const fontFamRes = await convertSvg(fontFamSvg, { scale: 1 });
  const fontFamPixels = await countForegroundPixels(fontFamRes.buffer, (r, g, b) => r === 0 && g === 0 && b === 0);
  console.log(`- Foreground pixels: ${fontFamPixels}`);
  assert(fontFamPixels > 50, "Font family text must have visible pixels");
  console.log("✓ PASS: Font family text rendered");

  // 4. Minimum Test Matrix: Font weight
  console.log("\n[Test 4] Font Weight (700 / bold)");
  const fontWeightSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="black"/><text x="20" y="50" fill="white" font-size="24" font-weight="700">Bold Test</text></svg>`;
  const fontWeightRes = await convertSvg(fontWeightSvg, { scale: 1 });
  const fontWeightPixels = await countForegroundPixels(fontWeightRes.buffer, (r, g, b) => r === 0 && g === 0 && b === 0);
  console.log(`- Foreground pixels: ${fontWeightPixels}`);
  assert(fontWeightPixels > 50, "Font weight text must have visible pixels");
  console.log("✓ PASS: Font weight text rendered");

  // 5. Minimum Test Matrix: Text alignment (text-anchor="middle")
  console.log("\n[Test 5] Text Alignment (text-anchor=middle)");
  const textAnchorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="black"/><text x="200" y="100" text-anchor="middle" fill="white" font-size="24">Centered Test</text></svg>`;
  const textAnchorRes = await convertSvg(textAnchorSvg, { scale: 1 });
  const textAnchorPixels = await countForegroundPixels(textAnchorRes.buffer, (r, g, b) => r === 0 && g === 0 && b === 0);
  console.log(`- Foreground pixels: ${textAnchorPixels}`);
  assert(textAnchorPixels > 50, "Centered text must have visible pixels");
  console.log("✓ PASS: Centered text rendered");

  // 6. Minimum Test Matrix: Dominant baseline (dominant-baseline="middle")
  console.log("\n[Test 6] Dominant Baseline (dominant-baseline=middle)");
  const baselineSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"><rect width="400" height="200" fill="black"/><text x="200" y="100" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="24">Baseline Test</text></svg>`;
  const baselineRes = await convertSvg(baselineSvg, { scale: 1 });
  const baselinePixels = await countForegroundPixels(baselineRes.buffer, (r, g, b) => r === 0 && g === 0 && b === 0);
  console.log(`- Foreground pixels: ${baselinePixels}`);
  assert(baselinePixels > 50, "Baseline text must have visible pixels");
  console.log("✓ PASS: Dominant baseline text rendered");

  // 7. Non-text SVGs (Ensure standard conversion remains unchanged)
  console.log("\n[Test 7] Non-text SVG conversion");
  const shapeSvg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="80" fill="red"/></svg>`;
  const shapeRes = await convertSvg(shapeSvg, { scale: 1 });
  assert.strictEqual(shapeRes.width, 200);
  assert.strictEqual(shapeRes.height, 200);
  const redPixels = await countForegroundPixels(shapeRes.buffer, (r, g, b, a) => a === 0);
  console.log(`- Rendered circle pixels: ${redPixels}`);
  assert(redPixels > 10000, "Circle must render correctly");
  console.log("✓ PASS: Non-text shape SVG converted perfectly");

  // 8. Security Sanitization Tests (Ensure security controls remain intact)
  console.log("\n[Test 8] Security Sanitization");
  const maliciousSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><foreignObject>evil</foreignObject><text x="10" y="20" onclick="alert(2)">Safe Text</text><circle cx="50" cy="50" r="20" fill="javascript:alert(3)"/></svg>`;
  const sanitized = sanitizeSvg(maliciousSvg);
  assert(!sanitized.includes("<script"), "Script tag must be stripped");
  assert(!sanitized.includes("<foreignObject"), "ForeignObject tag must be stripped");
  assert(!sanitized.includes("onclick"), "Event handlers must be stripped");
  assert(!sanitized.includes("javascript:"), "Javascript URLs must be stripped");
  assert(sanitized.includes("<text"), "Text tag must be preserved");
  assert(sanitized.includes("Safe Text"), "Text content must be preserved");
  console.log("✓ PASS: Security sanitization stripped all malicious content while preserving text");

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

runAllTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
