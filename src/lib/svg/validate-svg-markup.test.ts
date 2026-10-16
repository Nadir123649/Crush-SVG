import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateSvgMarkup } from "./validate-svg-markup.ts";

describe("validateSvgMarkup", () => {
  it("accepts ordinary, self-closing, and namespace-prefixed SVG roots", () => {
    const validSvgs = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"/>',
      '<svg:svg xmlns:svg="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><svg:circle cx="5" cy="5" r="4"/></svg:svg>',
      '<svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>',
    ];

    for (const svg of validSvgs) {
      assert.deepEqual(validateSvgMarkup(svg), { valid: true });
    }
  });

  it("accepts XML declarations, comments, doctypes, quoted greater-than signs, and embedded data", () => {
    const svg = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!-- editor export -->',
      '<!DOCTYPE svg [<!ENTITY label "icon">]>',
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">',
      '<title>&label;</title>',
      '<image href="data:image/png;base64,iVBORw0KGgo=" />',
      '<text aria-label="1 > 0">icon</text>',
      '</svg>',
    ].join("\n");

    assert.deepEqual(validateSvgMarkup(svg), { valid: true });
  });

  it("rejects malformed XML, non-SVG roots, and incorrect namespaces", () => {
    for (const svg of [
      "<svg><g></svg>",
      "<html><body/></html>",
      '<svg xmlns="urn:not-svg"/>',
      '<s:svg xmlns:s="urn:not-svg"/>',
    ]) {
      assert.equal(validateSvgMarkup(svg).valid, false, svg);
    }
  });

  it("continues rejecting executable SVG content", () => {
    for (const svg of [
      '<svg><script>alert(1)</script></svg>',
      '<svg onload="alert(1)"/>',
      '<svg><a href="javascript:alert(1)">x</a></svg>',
      '<svg:svg xmlns:svg="http://www.w3.org/2000/svg"><svg:script>alert(1)</svg:script></svg:svg>',
    ]) {
      assert.equal(validateSvgMarkup(svg).valid, false, svg);
    }
  });
});
