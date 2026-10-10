import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { isValidSvgContent } from "./converter";

const simpleSvg = `<?xml version="1.0" encoding="utf-8"?>
<svg
    version="1.1"
    id="Layer_1"
    xmlns="http://www.w3.org/2000/svg"
    width="100"
    height="100"
    viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="40" fill="#FF0000" />
</svg>`;

const illustratorSvg = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 24.1.0 - SVG Export Plug-In . SVG Version: 6.00 Build 0) -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
 viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
  <circle cx="50" cy="50" r="40" fill="#FF0000
" />
</svg>`;

describe("isValidSvgContent", () => {
  it("accepts SVG with an XML declaration and multiline attributes", () => {
    assert.equal(isValidSvgContent(simpleSvg), true);
  });

  it("accepts Illustrator SVG with a DOCTYPE and multiline attribute value", () => {
    assert.equal(isValidSvgContent(illustratorSvg), true);
  });

  it("rejects non-SVG and incomplete markup", () => {
    assert.equal(isValidSvgContent("<div>not SVG</div>"), false);
    assert.equal(isValidSvgContent("<svg><circle>"), false);
  });
});
