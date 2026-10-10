import assert from "node:assert/strict";
import test from "node:test";
import { classifyImage } from "./classify";

function makePixelBuffer(
  width: number,
  height: number,
  pixelAt: (x: number, y: number) => [number, number, number],
): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const [r, g, b] = pixelAt(x, y);
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

test("classifies detailed illustration texture as graphic", () => {
  const pixels = makePixelBuffer(256, 256, (x, y) => {
    if (x < 32 || x >= 224 || y < 32 || y >= 224) return [245, 245, 245];
    return [
      (x * 13 + y * 7) % 80,
      40 + ((x * 3 + y * 17) % 90),
      140 + ((x * 19 + y * 11) % 110),
    ];
  });

  assert.equal(classifyImage(pixels, 256, 256), "graphic");
});

test("classifies highly varied natural-color texture as photo", () => {
  let seed = 17;
  const nextChannel = () => {
    seed = (seed * 48271) % 0x7fffffff;
    return seed % 256;
  };
  const pixels = makePixelBuffer(256, 256, () => [
    nextChannel(),
    nextChannel(),
    nextChannel(),
  ]);

  assert.equal(classifyImage(pixels, 256, 256), "photo");
});
