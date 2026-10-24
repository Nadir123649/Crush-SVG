import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createIcoFromPngs,
  prepareSvgForResolution,
  validateIcoBytes,
  validatePngAsset,
} from "./favicon-generator.ts";

function pngHeader(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13, false);
  bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width, false);
  view.setUint32(20, height, false);
  return bytes;
}

describe("prepareSvgForResolution", () => {
  it("preserves a rectangular viewBox ratio and original root attributes", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" aria-label="a > b"><rect width="400" height="300"/></svg>';
    const prepared = prepareSvgForResolution(svg, 64, 64);

    assert.match(prepared, /width="64" height="48" viewBox="0 0 400 300"/);
    assert.match(prepared, /aria-label="a > b"/);
    assert.match(prepared, /<rect width="400" height="300"\/>/);
  });

  it("skips comments and XML declarations and preserves self-closing roots", () => {
    const svg = '<?xml version="1.0"?><!-- <svg viewBox="1 1 2 2"> --><svg:svg xmlns:svg="http://www.w3.org/2000/svg" viewBox="-10,-5,20,10" />';
    const prepared = prepareSvgForResolution(svg, 32, 32);

    assert.match(prepared, /<!-- <svg viewBox="1 1 2 2"> -->/);
    assert.match(prepared, /<svg:svg[^>]*width="32" height="16" viewBox="-10,-5,20,10"\s*\/>$/);
  });

  it("adds a viewBox for numeric intrinsic dimensions and leaves unknown dimensions alone", () => {
    const sized = prepareSvgForResolution('<svg width="100" height="50"><path d="M0 0h1"/></svg>', 16, 16);
    assert.match(sized, /width="16" height="8" viewBox="0 0 100 50"/);

    const unknown = '<svg width="100%" height="100%"><path d="M0 0h1"/></svg>';
    assert.equal(prepareSvgForResolution(unknown, 16, 16), unknown);
  });
});

describe("PNG and ICO asset validation", () => {
  it("accepts PNG headers only when signature and dimensions match", () => {
    validatePngAsset(pngHeader(32, 32), 32, 32);
    assert.throws(() => validatePngAsset(pngHeader(32, 16), 32, 32), /dimensions/);
    assert.throws(() => validatePngAsset(new Uint8Array(24), 32, 32), /signature/);
  });

  it("creates and validates a multi-resolution ICO containing its PNG entries", async () => {
    const pngs = [16, 32, 48].map((size) => ({ width: size, height: size, data: pngHeader(size, size) }));
    const ico = createIcoFromPngs(pngs);
    validateIcoBytes(new Uint8Array(await ico.arrayBuffer()), [16, 32, 48]);

    assert.throws(() => validateIcoBytes(new Uint8Array([0, 0, 0, 0, 0, 0]), [16, 32, 48]), /header/);
    assert.throws(() => createIcoFromPngs([]), /At least one PNG/);
    assert.throws(() => createIcoFromPngs([{ width: 16, height: 16, data: new Uint8Array(24) }]), /signature/);
  });
});
