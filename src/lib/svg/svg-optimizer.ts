/**
 * SVG Optimizer & Minifier Core Engine
 * Ultra-fast, pure TypeScript SVG compression pipeline.
 */

export interface SvgOptimizerOptions {
  /** Remove XML declaration and comments (default: true) */
  stripComments?: boolean;
  /** Remove editor metadata (Inkscape, Illustrator, Figma, Sketch) (default: true) */
  stripMetadata?: boolean;
  /** Remove empty groups and empty defs (default: true) */
  removeEmptyContainers?: boolean;
  /** Clean up redundant attributes and namespaces (default: true) */
  cleanAttributes?: boolean;
  /** Round decimal precision for numbers and path coordinates (default: 2) */
  precision?: number;
  /** Minify colors (e.g. #ffffff -> #fff, rgb(0,0,0) -> #000) (default: true) */
  minifyColors?: boolean;
  /** Collapse multi-whitespace and linebreaks (default: true) */
  collapseWhitespace?: boolean;
}

export interface SvgOptimizerResult {
  originalSvg: string;
  optimizedSvg: string;
  originalBytes: number;
  optimizedBytes: number;
  bytesSaved: number;
  percentSaved: number;
  warnings: string[];
}

const DEFAULT_OPTIONS: Required<SvgOptimizerOptions> = {
  stripComments: true,
  stripMetadata: true,
  removeEmptyContainers: true,
  cleanAttributes: true,
  precision: 2,
  minifyColors: true,
  collapseWhitespace: true,
};

function getByteSize(str: string): number {
  return new TextEncoder().encode(str).length;
}

function minifyColorString(val: string): string {
  // Convert rgb(r, g, b) to hex
  val = val.replace(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/gi, (_, r, g, b) => {
    const hex = (
      (1 << 24) +
      (parseInt(r, 10) << 16) +
      (parseInt(g, 10) << 8) +
      parseInt(b, 10)
    )
      .toString(16)
      .slice(1);
    return `#${hex}`;
  });

  // Shorten 6-char hex to 3-char if possible (#ffffff -> #fff, #112233 -> #123)
  val = val.replace(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3\b/gi, "#$1$2$3");

  return val;
}

function roundNumbersInString(str: string, precision: number): string {
  if (precision < 0) return str;
  // Match floating point numbers: digits.digits with optional negative sign
  return str.replace(/-?\d+\.\d+/g, (match) => {
    const num = parseFloat(match);
    if (Number.isNaN(num)) return match;
    const rounded = Number(num.toFixed(precision));
    return String(rounded);
  });
}

export function optimizeSvg(
  rawSvg: string,
  options: SvgOptimizerOptions = {}
): SvgOptimizerResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];
  const originalBytes = getByteSize(rawSvg);

  if (!rawSvg || rawSvg.trim() === "") {
    return {
      originalSvg: rawSvg,
      optimizedSvg: "",
      originalBytes: 0,
      optimizedBytes: 0,
      bytesSaved: 0,
      percentSaved: 0,
      warnings: ["Empty SVG input provided."],
    };
  }

  let svg = rawSvg.trim();

  // 1. Strip XML declaration, doctype, and CDATA wrappers
  if (opts.stripMetadata) {
    svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, "");
    svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, "");
    svg = svg.replace(/<!ENTITY[\s\S]*?>/gi, "");
    svg = svg.replace(/<metadata[\s\S]*?<\/metadata>/gi, "");
  }

  // 2. Strip HTML/XML comments (<!-- ... -->)
  if (opts.stripComments) {
    svg = svg.replace(/<!--[\s\S]*?-->/g, "");
  }

  // 3. Strip editor-specific namespaces & attributes (Illustrator, Inkscape, Sketch, Figma)
  if (opts.stripMetadata) {
    // Strip namespaces
    svg = svg.replace(/\sxmlns:(sketch|i|inkscape|sodipodi|adobe|illustrator)="[^"]*"/gi, "");
    // Strip editor attributes
    svg = svg.replace(/\s(sketch|inkscape|sodipodi|i|adobe):[a-zA-Z0-9_-]+="[^"]*"/gi, "");
    svg = svg.replace(/\sdata-name="[^"]*"/gi, "");
    svg = svg.replace(/\sdata-id="[^"]*"/gi, "");
    svg = svg.replace(/\sdata-testid="[^"]*"/gi, "");
    svg = svg.replace(/\senable-background="[^"]*"/gi, "");
    svg = svg.replace(/\sxml:space="preserve"/gi, "");
  }

  // 4. Remove empty id="" or id="null" or id="undefined"
  if (opts.cleanAttributes) {
    svg = svg.replace(/\sid="(null|undefined|\s*)"/gi, "");
  }

  // 5. Minify Colors
  if (opts.minifyColors) {
    svg = minifyColorString(svg);
  }

  // 6. Round floating point numbers in attributes and path 'd' data
  if (opts.precision >= 0) {
    svg = roundNumbersInString(svg, opts.precision);
  }

  // 7. Strip empty containers (<g></g>, <defs></defs>)
  if (opts.removeEmptyContainers) {
    // Repeatedly clean nested empty groups
    for (let i = 0; i < 3; i++) {
      svg = svg.replace(/<g[^>]*>\s*<\/g>/gi, "");
      svg = svg.replace(/<defs[^>]*>\s*<\/defs>/gi, "");
    }
  }

  // 8. Collapse whitespace and linebreaks
  if (opts.collapseWhitespace) {
    // Collapse multi spaces inside tags
    svg = svg.replace(/\s+/g, " ");
    // Remove space between tag brackets: > < -> ><
    svg = svg.replace(/>\s+</g, "><");
    svg = svg.replace(/\s+>/g, ">");
    svg = svg.replace(/<(\w+)\s+/g, "<$1 ");
    svg = svg.trim();
  }

  const optimizedBytes = getByteSize(svg);
  const bytesSaved = Math.max(0, originalBytes - optimizedBytes);
  const percentSaved =
    originalBytes > 0 ? Number(((bytesSaved / originalBytes) * 100).toFixed(1)) : 0;

  return {
    originalSvg: rawSvg,
    optimizedSvg: svg,
    originalBytes,
    optimizedBytes,
    bytesSaved,
    percentSaved,
    warnings,
  };
}
