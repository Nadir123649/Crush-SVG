import 'server-only'

export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
export const XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'

const REMOVED_ELEMENTS = ['script', 'foreignObject', 'iframe', 'embed', 'object']

const URL_ATTRIBUTES = new Set([
  'href',
  'xlink:href',
  'src',
  'style',
  'fill',
  'stroke',
  'filter',
  'background',
  'poster',
  'action',
  'formaction',
  'cite',
  'codebase',
  'longdesc',
  'usemap',
])

const DATA_IMAGE_WHITELIST =
  /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,/i

interface ParsedTag {
  name: string
  attrs: Array<{ name: string; value: string | null }>
  selfClosing: boolean
}

const ATTR_RE = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g

function parseTag(tag: string): ParsedTag | null {
  const match = /^<([a-zA-Z][a-zA-Z0-9:_-]*)([^>]*)>/.exec(tag)
  if (!match) return null
  const name = match[1]
  const rest = match[2]
  const selfClosing = /\/\s*$/.test(rest)

  const attrs: ParsedTag['attrs'] = []
  let attrMatch: RegExpExecArray | null
  ATTR_RE.lastIndex = 0
  while ((attrMatch = ATTR_RE.exec(rest)) !== null) {
    const [, rawName, dq, sq, unquoted] = attrMatch
    if (!rawName) continue
    const value = dq ?? sq ?? unquoted ?? null
    attrs.push({ name: rawName, value })
  }
  return { name, attrs, selfClosing }
}

function stripScheme(value: string): string {
  return value
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/expression\s*\(/gi, '')
}

function sanitizeAttrValue(name: string, value: string): string {
  let cleaned = stripScheme(value)

  if (URL_ATTRIBUTES.has(name.toLowerCase())) {
    const trimmed = cleaned.trim()
    if (/^data:/i.test(trimmed) && !DATA_IMAGE_WHITELIST.test(trimmed)) {
      cleaned = cleaned.replace(/data:/gi, '')
    }
  }

  return cleaned
}

function rebuildTag(tag: string): string {
  const parsed = parseTag(tag)
  if (!parsed) return tag
  const name = parsed.name

  const kept: string[] = []
  for (const attr of parsed.attrs) {
    if (/^on/i.test(attr.name)) continue
    const value = attr.value === null ? null : sanitizeAttrValue(attr.name, attr.value)
    if (value === null) {
      kept.push(attr.name)
    } else {
      kept.push(`${attr.name}="${value}"`)
    }
  }

  if (name.toLowerCase() === 'svg') {
    const hasNamespace = kept.some(
      (a) => a.startsWith('xmlns=') && a.includes(SVG_NAMESPACE)
    )
    const hasXlink = kept.some((a) => a.startsWith('xmlns:xlink='))
    if (!hasNamespace) kept.unshift(`xmlns="${SVG_NAMESPACE}"`)
    if (!hasXlink) kept.push(`xmlns:xlink="${XLINK_NAMESPACE}"`)
  }

  const close = parsed.selfClosing ? ' />' : '>'
  return `<${name} ${kept.join(' ')}${close}`
}

function indexOfTagEnd(svg: string, from: number): number {
  let quote: string | null = null
  for (let j = from + 1; j < svg.length; j++) {
    const c = svg[j]
    if (quote) {
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") {
      quote = c
    } else if (c === '>') {
      return j + 1
    }
  }
  return svg.length
}

/**
 * Walks every tag in the document (skipping comments, CDATA, and processing
 * instructions) and applies `fn` to each opening tag.
 */
function forEachTag(svg: string, fn: (tag: string) => string): string {
  let out = ''
  let i = 0
  while (i < svg.length) {
    const lt = svg.indexOf('<', i)
    if (lt === -1) {
      out += svg.slice(i)
      break
    }
    out += svg.slice(i, lt)

    if (svg.startsWith('<!--', lt)) {
      const end = svg.indexOf('-->', lt + 4)
      if (end === -1) {
        out += svg.slice(lt)
        break
      }
      out += svg.slice(lt, end + 3)
      i = end + 3
      continue
    }

    if (svg.startsWith('<![CDATA[', lt)) {
      const end = svg.indexOf(']]>', lt + 9)
      if (end === -1) {
        out += svg.slice(lt)
        break
      }
      out += svg.slice(lt, end + 3)
      i = end + 3
      continue
    }

    if (svg.startsWith('<?', lt) || svg.startsWith('<!', lt) || svg.startsWith('</', lt)) {
      const end = indexOfTagEnd(svg, lt)
      out += svg.slice(lt, end)
      i = end
      continue
    }

    const end = indexOfTagEnd(svg, lt)
    out += fn(svg.slice(lt, end))
    i = end
  }
  return out
}

function removeElements(svg: string, tagName: string): string {
  const escaped = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let sanitized = svg.replace(new RegExp(`<${escaped}\\b[^>]*\\/>`, 'gi'), '')

  let previous: string
  do {
    previous = sanitized
    sanitized = sanitized.replace(
      new RegExp(`<${escaped}\\b[^>]*>[\\s\\S]*?<\\/${escaped}\\s*>`, 'gi'),
      ''
    )
  } while (sanitized !== previous)

  return sanitized
}

/**
 * Attribute-aware SVG sanitizer. Removes executable elements and rewrites
 * dangerous attribute values (event handlers, script: schemes) without ever
 * touching text nodes, path data, comments, or CDATA. Embedded
 * `data:image/*;base64` payloads in URL attributes survive so Figma-style
 * pattern SVGs still render.
 */
export function sanitizeSvg(svg: string): string {
  let sanitized = svg

  for (const tag of REMOVED_ELEMENTS) {
    sanitized = removeElements(sanitized, tag)
  }

  sanitized = forEachTag(sanitized, rebuildTag)

  return inlineUseImages(sanitized)
}

/**
 * Fix for Figma-style exports where `<pattern><use xlink:href="#image…"/></pattern>`
 * references an embedded `<image>` in `<defs>`. librsvg cannot reliably resolve
 * `<use>` → `<image>`, so the referenced image is inlined in place of the
 * `<use>` with the use element's own attributes (transform etc.) applied.
 */
export function inlineUseImages(svg: string): string {
  const images = new Map<string, { attrs: string; selfClosing: boolean }>()
  const imageRe = /<image\b([^>]*)>/gi
  let match: RegExpExecArray | null

  while ((match = imageRe.exec(svg)) !== null) {
    const attrs = match[1]
    const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)
    if (!idMatch) continue
    images.set(idMatch[1], {
      attrs,
      selfClosing: /\/\s*$/.test(attrs),
    })
  }

  if (images.size === 0) return svg

  const useRe = /<use\b([^>]*?)\b(?:xlink:href|href)\s*=\s*["']#([^"']+)["']([^>]*)>/gi
  return svg.replace(useRe, (full, _prefix: string, id: string, rest: string) => {
    const image = images.get(id)
    if (!image) return full

    const restAttrs = rest.replace(/\/\s*$/, '').trim()
    const imageAttrs = image.attrs
      .replace(/\bid\s*=\s*["'][^"']+["']/i, '')
      .replace(/\/\s*$/, '')
      .trim()
    const selfClosing = image.selfClosing || /\/\s*$/.test(rest)

    return `<image ${[restAttrs, imageAttrs].filter(Boolean).join(' ')}${selfClosing ? ' />' : '>'}`
  })
}