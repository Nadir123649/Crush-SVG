/**
 * Fast, linear, non-backtracking SVG code formatter.
 *
 * Avoids quadratic regex backtracking and large-string copies that cause
 * browser hangs/crashes on large or complex SVGs.
 */

const MAX_FORMATTABLE_CHARS = 1_000_000;
const MAX_OUTPUT_LINES = 40_000;

export interface FormatSvgResult {
  formatted: string;
  changed: boolean;
}

export function formatSvgCode(svg: string): FormatSvgResult {
  if (svg.length > MAX_FORMATTABLE_CHARS) {
    throw new Error("SVG code exceeds 1MB. Kept minified for performance.");
  }

  // Tokenize comments, CDATA, XML declarations, tags, and text nodes
  const tokenRegex = /(<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[^>]*\?>|<[^>]+>|[^<]+)/g;
  const tokens = svg.match(tokenRegex);
  if (!tokens) {
    return { formatted: svg, changed: false };
  }

  const lines: string[] = [];
  let indentLevel = 0;
  const indentStr = "  ";

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const trimmed = token.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("</")) {
      // Closing tag: decrease indent before pushing
      indentLevel = Math.max(0, indentLevel - 1);
      lines.push(indentStr.repeat(indentLevel) + trimmed);
    } else if (
      trimmed.startsWith("<!--") ||
      trimmed.startsWith("<!") ||
      trimmed.startsWith("<?")
    ) {
      // Directives/comments/CDATA: keep current indent
      lines.push(indentStr.repeat(indentLevel) + trimmed);
    } else if (trimmed.startsWith("<")) {
      const isSelfClosing = trimmed.endsWith("/>") || trimmed.endsWith("/ >");
      const tagNameMatch = /^<([a-zA-Z0-9_:-]+)/.exec(trimmed);
      const tagName = tagNameMatch ? tagNameMatch[1] : "";

      if (isSelfClosing) {
        lines.push(indentStr.repeat(indentLevel) + trimmed);
      } else if (tagName) {
        // Look ahead for simple inline text nodes like <text ...>Label</text>
        let hasInlineContent = false;
        if (i + 2 < tokens.length) {
          const nextText = tokens[i + 1].trim();
          const nextTag = tokens[i + 2].trim();
          if (
            nextTag === `</${tagName}>` &&
            !nextText.includes("<") &&
            nextText.length < 120
          ) {
            lines.push(
              indentStr.repeat(indentLevel) + `${trimmed}${nextText}${nextTag}`
            );
            i += 2;
            hasInlineContent = true;
          }
        }

        if (!hasInlineContent) {
          lines.push(indentStr.repeat(indentLevel) + trimmed);
          indentLevel++;
        }
      } else {
        lines.push(indentStr.repeat(indentLevel) + trimmed);
      }
    } else {
      // Text node
      lines.push(indentStr.repeat(indentLevel) + trimmed);
    }

    if (lines.length > MAX_OUTPUT_LINES) {
      throw new Error("SVG output exceeded maximum line limit.");
    }
  }

  const formatted = lines.join("\n");
  return { formatted, changed: formatted !== svg.trim() };
}
