import { XMLValidator } from "fast-xml-parser";

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const MAX_SVG_CHARS = 10 * 1024 * 1024;

export interface SvgMarkupValidation {
  valid: boolean;
  error?: string;
}

function skipDoctype(source: string, start: number): number {
  let quote = "";
  let subsetDepth = 0;

  for (let index = start; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (char === quote) quote = "";
    } else if (char === "\"" || char === "'") {
      quote = char;
    } else if (char === "[") {
      subsetDepth++;
    } else if (char === "]") {
      subsetDepth = Math.max(0, subsetDepth - 1);
    } else if (char === ">" && subsetDepth === 0) {
      return index + 1;
    }
  }

  return source.length;
}

function getRootTag(source: string): string | null {
  let index = source.charCodeAt(0) === 0xfeff ? 1 : 0;

  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index++;

    if (source.startsWith("<!--", index)) {
      const end = source.indexOf("-->", index + 4);
      if (end < 0) return null;
      index = end + 3;
      continue;
    }
    if (source.startsWith("<?", index)) {
      const end = source.indexOf("?>", index + 2);
      if (end < 0) return null;
      index = end + 2;
      continue;
    }
    if (/^<!doctype\b/i.test(source.slice(index))) {
      index = skipDoctype(source, index + 2);
      continue;
    }

    if (source[index] !== "<" || source[index + 1] === "/" || source[index + 1] === "!") {
      return null;
    }

    let quote = "";
    for (let end = index + 1; end < source.length; end++) {
      const char = source[end];
      if (quote) {
        if (char === quote) quote = "";
      } else if (char === "\"" || char === "'") {
        quote = char;
      } else if (char === ">") {
        return source.slice(index, end + 1);
      }
    }
    return null;
  }

  return null;
}

function getAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const nameEnd = tag.search(/[\s/>]/);
  const attrText = tag.slice(nameEnd < 0 ? tag.length : nameEnd, -1);
  const attributePattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(attrText)) !== null) {
    attributes.set(match[1], match[2] ?? match[3] ?? "");
  }

  return attributes;
}

/** Validates XML structure and the SVG root without rejecting valid SVG syntax. */
export function validateSvgMarkup(svg: string): SvgMarkupValidation {
  const trimmed = svg.trim();
  if (!trimmed) return { valid: false, error: "SVG content is empty" };
  if (trimmed.length > MAX_SVG_CHARS) {
    return { valid: false, error: "SVG file too large. Maximum size is 10MB." };
  }

  const xmlResult = XMLValidator.validate(trimmed);
  if (xmlResult !== true) {
    return { valid: false, error: "SVG markup is not well-formed XML." };
  }

  const rootTag = getRootTag(trimmed);
  const rootName = rootTag?.match(/^<([\p{L}_][\p{L}\p{N}_.:-]*)/u)?.[1];
  const localName = rootName?.split(":").at(-1);
  if (!rootTag || !rootName || localName !== "svg") {
    return { valid: false, error: "The document root must be an SVG element." };
  }

  const attributes = getAttributes(rootTag);
  const prefix = rootName.includes(":") ? rootName.slice(0, rootName.indexOf(":")) : null;
  const declaredNamespace = attributes.get(prefix ? `xmlns:${prefix}` : "xmlns");
  if (declaredNamespace && declaredNamespace !== SVG_NAMESPACE) {
    return { valid: false, error: "The SVG root uses an unsupported XML namespace." };
  }
  if (prefix && declaredNamespace !== SVG_NAMESPACE) {
    return { valid: false, error: "The SVG root namespace prefix is not declared." };
  }

  if (/<(?:[A-Za-z_][\w.-]*:)?script\b|\bon[a-z]+\s*=|javascript:|vbscript:|expression\s*\(/i.test(trimmed)) {
    return { valid: false, error: "SVG contains potentially unsafe content." };
  }
  return { valid: true };
}
