/**
 * SVG to Code Compiler for CrushSVG
 * Converts raw SVG markup into production-ready frontend components:
 * - React TSX (TypeScript with SVGProps)
 * - React JSX (JavaScript)
 * - Vue 3 (SFC <script setup>)
 * - Svelte 4/5
 * - Tailwind Inline SVG
 * - React Native (react-native-svg)
 */

export type TargetFramework = "react-tsx" | "react-jsx" | "vue" | "svelte" | "tailwind" | "react-native";

export interface SvgToCodeOptions {
  componentName?: string;
  typescript?: boolean;
  currentColor?: boolean;
  forwardRef?: boolean;
  memo?: boolean;
  nativeSvg?: boolean;
  exportType?: "named" | "default";
}

const SVG_ATTR_MAP: Record<string, string> = {
  "accent-height": "accentHeight",
  "alignment-baseline": "alignmentBaseline",
  "arabic-form": "arabicForm",
  "baseline-shift": "baselineShift",
  "cap-height": "capHeight",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "color-interpolation": "colorInterpolation",
  "color-interpolation-filters": "colorInterpolationFilters",
  "color-profile": "colorProfile",
  "color-rendering": "colorRendering",
  "dominant-baseline": "dominantBaseline",
  "enable-background": "enableBackground",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "flood-color": "floodColor",
  "flood-opacity": "floodOpacity",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-size-adjust": "fontSizeAdjust",
  "font-stretch": "fontStretch",
  "font-style": "fontStyle",
  "font-variant": "fontVariant",
  "font-weight": "fontWeight",
  "glyph-name": "glyphName",
  "glyph-orientation-horizontal": "glyphOrientationHorizontal",
  "glyph-orientation-vertical": "glyphOrientationVertical",
  "horiz-adv-x": "horizAdvX",
  "horiz-origin-x": "horizOriginX",
  "image-rendering": "imageRendering",
  "letter-spacing": "letterSpacing",
  "lighting-color": "lightingColor",
  "marker-end": "markerEnd",
  "marker-mid": "markerMid",
  "marker-start": "markerStart",
  "overline-position": "overlinePosition",
  "overline-thickness": "overlineThickness",
  "paint-order": "paintOrder",
  "panose-1": "panose1",
  "pointer-events": "pointerEvents",
  "rendering-intent": "renderingIntent",
  "shape-rendering": "shapeRendering",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "strikethrough-position": "strikethroughPosition",
  "strikethrough-thickness": "strikethroughThickness",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
  "stroke-width": "strokeWidth",
  "text-anchor": "textAnchor",
  "text-decoration": "textDecoration",
  "text-rendering": "textRendering",
  "underline-position": "underlinePosition",
  "underline-thickness": "underlineThickness",
  "unicode-bidi": "unicodeBidi",
  "unicode-range": "unicodeRange",
  "units-per-em": "unitsPerEm",
  "v-alphabetic": "vAlphabetic",
  "v-hanging": "vHanging",
  "v-ideographic": "vIdeographic",
  "v-mathematical": "vMathematical",
  "vector-effect": "vectorEffect",
  "vert-adv-y": "vertAdvY",
  "vert-origin-x": "vertOriginX",
  "vert-origin-y": "vertOriginY",
  "word-spacing": "wordSpacing",
  "writing-mode": "writingMode",
  "xmlns:xlink": "xmlnsXlink",
  "xlink:href": "xlinkHref",
  "xlink:title": "xlinkTitle",
  "xml:space": "xmlSpace",
  "xmlns:svg": "xmlnsSvg",
  "class": "className",
};

/** Convert inline CSS style strings like `style="fill: #fff; stroke-width: 2px"` into React style objects */
function styleStringToReactObject(styleStr: string): string {
  const rules = styleStr.split(";").filter((s) => s.trim().length > 0);
  const pairs: string[] = [];
  for (const rule of rules) {
    const [rawKey, rawVal] = rule.split(":");
    if (!rawKey || !rawVal) continue;
    const key = rawKey.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    const val = rawVal.trim();
    pairs.push(`${key}: "${val}"`);
  }
  return `{{ ${pairs.join(", ")} }}`;
}

/** Convert raw SVG attributes to JSX-compatible camelCase */
export function convertSvgAttributesToJsx(svgString: string, currentColor = false): string {
  // 1. Remove XML declarations and DOCTYPE
  let result = svgString
    .replace(/<\?xml[\s\S]*?\?>/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // 2. Replace hardcoded colors with currentColor if requested
  if (currentColor) {
    result = result.replace(/fill="(?!none|url\(|transparent)[^"]+"/gi, 'fill="currentColor"');
    result = result.replace(/stroke="(?!none|url\(|transparent)[^"]+"/gi, 'stroke="currentColor"');
  }

  // 3. Replace style="..." with style={{ ... }}
  result = result.replace(/style="([^"]+)"/gi, (_, styleContent) => {
    return `style=${styleStringToReactObject(styleContent)}`;
  });

  // 4. Map known SVG attributes to camelCase
  for (const [kebab, camel] of Object.entries(SVG_ATTR_MAP)) {
    const regex = new RegExp(`\\b${kebab}=`, "g");
    result = result.replace(regex, `${camel}=`);
  }

  // 5. Clean up any leftover duplicate whitespace
  return result.trim();
}

/** Extract inner contents and viewBox from an SVG */
export function parseSvgRoot(svgString: string): {
  viewBox: string;
  width: string;
  height: string;
  innerContent: string;
  rootAttributes: Record<string, string>;
} {
  const clean = svgString.replace(/<\?xml[\s\S]*?\?>/gi, "").replace(/<!DOCTYPE[\s\S]*?>/gi, "").trim();
  const svgMatch = clean.match(/<svg([^>]*)>([\s\S]*)<\/svg>/i);

  if (!svgMatch) {
    return {
      viewBox: "0 0 24 24",
      width: "24",
      height: "24",
      innerContent: clean,
      rootAttributes: {},
    };
  }

  const rawAttrs = svgMatch[1] || "";
  const innerContent = (svgMatch[2] || "").trim();

  const viewBoxMatch = rawAttrs.match(/viewBox="([^"]+)"/i);
  const widthMatch = rawAttrs.match(/width="([^"]+)"/i);
  const heightMatch = rawAttrs.match(/height="([^"]+)"/i);

  return {
    viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24",
    width: widthMatch ? widthMatch[1].replace(/px$/, "") : "24",
    height: heightMatch ? heightMatch[1].replace(/px$/, "") : "24",
    innerContent,
    rootAttributes: {},
  };
}

/** Sanitize component name to PascalCase */
export function sanitizeComponentName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleaned) return "Icon";
  const pascal = cleaned
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return pascal.charAt(0).toUpperCase() + pascal.slice(1);
}

/**
 * Main SVG-to-Code generator
 */
export function generateSvgCode(
  rawSvg: string,
  framework: TargetFramework,
  options: SvgToCodeOptions = {}
): string {
  const compName = sanitizeComponentName(options.componentName || "CustomIcon");
  const { viewBox, width, height, innerContent } = parseSvgRoot(rawSvg);
  const currentColor = !!options.currentColor;
  const jsxInner = convertSvgAttributesToJsx(innerContent, currentColor);

  switch (framework) {
    case "react-tsx": {
      const isForwardRef = !!options.forwardRef;
      if (isForwardRef) {
        return `import React, { forwardRef } from "react";

export interface ${compName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

export const ${compName} = forwardRef<SVGSVGElement, ${compName}Props>(
  ({ size = ${width || 24}, color = "${currentColor ? "currentColor" : "currentColor"}", className = "", ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="${viewBox}"
      fill="${currentColor ? "currentColor" : "none"}"
      stroke="${currentColor ? "currentColor" : "none"}"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      ${jsxInner}
    </svg>
  )
);

${compName}.displayName = "${compName}";

export default ${compName};
`;
      }

      return `import React from "react";

export interface ${compName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

export const ${compName}: React.FC<${compName}Props> = ({
  size = ${width || 24},
  color = "${currentColor ? "currentColor" : "currentColor"}",
  className = "",
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="${viewBox}"
    fill="${currentColor ? "currentColor" : "none"}"
    stroke="${currentColor ? "currentColor" : "none"}"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    {...props}
  >
    ${jsxInner}
  </svg>
);

export default ${compName};
`;
    }

    case "react-jsx": {
      const isForwardRef = !!options.forwardRef;
      if (isForwardRef) {
        return `import React, { forwardRef } from "react";

export const ${compName} = forwardRef(
  ({ size = ${width || 24}, color = "currentColor", className = "", ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="${viewBox}"
      fill="${currentColor ? "currentColor" : "none"}"
      stroke="${currentColor ? "currentColor" : "none"}"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      ${jsxInner}
    </svg>
  )
);

${compName}.displayName = "${compName}";

export default ${compName};
`;
      }

      return `import React from "react";

export function ${compName}({
  size = ${width || 24},
  color = "currentColor",
  className = "",
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="${viewBox}"
      fill="${currentColor ? "currentColor" : "none"}"
      stroke="${currentColor ? "currentColor" : "none"}"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      ${jsxInner}
    </svg>
  );
}

export default ${compName};
`;
    }

    case "vue": {
      const vueInner = currentColor
        ? innerContent.replace(/fill="(?!none|url\(|transparent)[^"]+"/gi, 'fill="currentColor"').replace(/stroke="(?!none|url\(|transparent)[^"]+"/gi, 'stroke="currentColor"')
        : innerContent;

      return `<template>
  <svg
    :width="size"
    :height="size"
    viewBox="${viewBox}"
    :fill="currentColor ? 'currentColor' : undefined"
    xmlns="http://www.w3.org/2000/svg"
    v-bind="$attrs"
  >
    ${vueInner}
  </svg>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    currentColor?: boolean;
  }>(),
  {
    size: ${width || 24},
    currentColor: ${currentColor},
  }
);
</script>
`;
    }

    case "svelte": {
      const svelteInner = currentColor
        ? innerContent.replace(/fill="(?!none|url\(|transparent)[^"]+"/gi, 'fill="currentColor"').replace(/stroke="(?!none|url\(|transparent)[^"]+"/gi, 'stroke="currentColor"')
        : innerContent;

      return `<script>
  export let size = ${width || 24};
  export let color = "${currentColor ? "currentColor" : "currentColor"}";
</script>

<svg
  width={size}
  height={size}
  viewBox="${viewBox}"
  fill={color}
  xmlns="http://www.w3.org/2000/svg"
  {...$$restProps}
>
  ${svelteInner}
</svg>
`;
    }

    case "tailwind": {
      const tailwindInner = currentColor
        ? innerContent.replace(/fill="(?!none|url\(|transparent)[^"]+"/gi, 'fill="currentColor"').replace(/stroke="(?!none|url\(|transparent)[^"]+"/gi, 'stroke="currentColor"')
        : innerContent;

      return `<svg
  class="w-6 h-6 text-gray-800 dark:text-white"
  aria-hidden="true"
  xmlns="http://www.w3.org/2000/svg"
  viewBox="${viewBox}"
  fill="none"
>
  ${tailwindInner}
</svg>
`;
    }

    case "react-native": {
      // Convert standard SVG tags to react-native-svg capitalized components
      let rnInner = convertSvgAttributesToJsx(innerContent, currentColor);
      const tags = ["path", "g", "circle", "rect", "line", "polyline", "polygon", "defs", "linearGradient", "radialGradient", "stop", "clipPath", "text", "tspan"];
      const usedTags = new Set<string>();

      for (const tag of tags) {
        const regexOpen = new RegExp(`<${tag}(\\b|>)`, "gi");
        const regexClose = new RegExp(`</${tag}>`, "gi");
        const capTag = tag.charAt(0).toUpperCase() + tag.slice(1);

        if (regexOpen.test(rnInner)) {
          usedTags.add(capTag);
          rnInner = rnInner.replace(regexOpen, `<${capTag}$1`).replace(regexClose, `</${capTag}>`);
        }
      }

      return `import React from "react";
import Svg, { ${Array.from(usedTags).join(", ")} } from "react-native-svg";

export interface ${compName}Props {
  size?: number;
  color?: string;
}

export const ${compName}: React.FC<${compName}Props> = ({
  size = ${width || 24},
  color = "currentColor",
}) => (
  <Svg width={size} height={size} viewBox="${viewBox}">
    ${rnInner}
  </Svg>
);

export default ${compName};
`;
    }

    default:
      return rawSvg;
  }
}
