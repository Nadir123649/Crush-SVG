import "server-only";

/**
 * Drop degenerate / invisible paths produced by the tracer (zero-area moveto-only
 * shapes, or paths with no paint). Pure string surgery — deterministic, no deps.
 */
export function optimizeSvg(svg: string): string {
  return svg.replace(/<path\b([^>]*?)\/?>/gi, (tag, attrs: string) => {
    const d = (attrs.match(/\bd\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").trim();
    if (!d) return "";
    if (/^[Mm][\s,\-\d.]*$/i.test(d)) return "";
    const fill = (attrs.match(/\bfill\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").trim().toLowerCase();
    const stroke = (attrs.match(/\bstroke\s*=\s*["']([^"']*)["']/i)?.[1] ?? "").trim().toLowerCase();
    if (fill === "none" && stroke === "none") return "";
    return tag;
  });
}
