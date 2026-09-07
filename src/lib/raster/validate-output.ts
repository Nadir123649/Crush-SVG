import "server-only";
import { sanitizeSvg } from "../svg/svg-sanitize";
import { parseSvgDimensions } from "../svg/svg-dims";
import { RASTER_LIMITS } from "./limits";
import { RasterConversionError } from "./errors";

export interface ValidatedSvg {
  svg: string;
  width: number;
  height: number;
}

/**
 * Sanitize (strip script/foreignObject, enforce namespace) and structurally
 * validate the traced SVG. Throws RasterConversionError on failure.
 */
export function validateRasterOutput(rawSvg: string): ValidatedSvg {
  if (!rawSvg || !/<svg/i.test(rawSvg)) {
    throw new RasterConversionError("svg_invalid", "Tracer produced no valid SVG root.");
  }
  if (rawSvg.length > RASTER_LIMITS.MAX_SVG_BYTES) {
    throw new RasterConversionError(
      "svg_invalid",
      "Produced SVG is too large; try a simpler image or lower quality.",
    );
  }
  const svg = sanitizeSvg(rawSvg);
  const dims = parseSvgDimensions(svg);
  if (!dims.width || !dims.height || dims.width <= 0 || dims.height <= 0) {
    throw new RasterConversionError("svg_invalid", "Produced SVG has no usable dimensions.");
  }
  return { svg, width: dims.width, height: dims.height };
}
