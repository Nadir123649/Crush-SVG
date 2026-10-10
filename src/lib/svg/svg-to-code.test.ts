import { test } from "node:test";
import assert from "node:assert/strict";
import { generateSvgCode, parseSvgRoot } from "./svg-to-code";

test("parses root SVG fill and stroke attributes", () => {
  const parsed = parseSvgRoot(
    '<svg viewBox="0 0 24 24" fill="#D94A1E" stroke=\'#222\'><path d="M0 0" /></svg>',
  );

  assert.equal(parsed.rootAttributes.fill, "#D94A1E");
  assert.equal(parsed.rootAttributes.stroke, "#222");
});

test("preserves root fill and stroke in generated React components", () => {
  const svg = '<svg viewBox="0 0 24 24" fill="#D94A1E" stroke="#222"><path d="M0 0" /></svg>';
  const code = generateSvgCode(svg, "react-tsx");

  assert.match(code, /fill=\{"#D94A1E"\}/);
  assert.match(code, /stroke=\{"#222"\}/);
});

test("does not add root paints when the source SVG has no root colors", () => {
  const code = generateSvgCode('<svg><path d="M0 0" /></svg>', "react-tsx");

  assert.doesNotMatch(code, /fill=\{/);
  assert.doesNotMatch(code, /stroke=\{/);
  assert.doesNotMatch(generateSvgCode('<svg><path d="M0 0" /></svg>', "svelte"), /fill=\{/);
  assert.doesNotMatch(generateSvgCode('<svg><path d="M0 0" /></svg>', "tailwind"), /fill="/);
});

test("maps root colors to currentColor while preserving none and URL paints", () => {
  const svg = '<svg fill="#D94A1E" stroke="url(#gradient)"><path d="M0 0" /></svg>';
  const code = generateSvgCode(svg, "react-jsx", { currentColor: true });

  assert.match(code, /fill=\{"currentColor"\}/);
  assert.match(code, /stroke=\{"url\(#gradient\)"\}/);

  const noneCode = generateSvgCode(
    '<svg fill="none" stroke="none"><path d="M0 0" /></svg>',
    "react-tsx",
    { currentColor: true },
  );
  assert.match(noneCode, /fill=\{"none"\}/);
  assert.match(noneCode, /stroke=\{"none"\}/);
});

test("keeps root paints in Vue, Svelte, Tailwind, and React Native output", () => {
  const svg = '<svg fill="#123456" stroke="#654321"><path d="M0 0" /></svg>';

  assert.match(generateSvgCode(svg, "vue"), /fill="#123456"/);
  assert.match(generateSvgCode(svg, "vue"), /stroke="#654321"/);
  assert.match(generateSvgCode(svg, "svelte"), /fill=\{"#123456"\}/);
  assert.match(generateSvgCode(svg, "svelte"), /stroke=\{"#654321"\}/);
  assert.match(generateSvgCode(svg, "tailwind"), /fill="#123456"/);
  assert.match(generateSvgCode(svg, "tailwind"), /stroke="#654321"/);
  assert.match(generateSvgCode(svg, "react-native"), /fill=\{"#123456"\}/);
  assert.match(generateSvgCode(svg, "react-native"), /stroke=\{"#654321"\}/);
});
