export interface SvgDimensions {
    width?: number;
    height?: number;
}
export const MAX_OUTPUT_SIZE = 4000;
const LENGTH_RE = /^(\d+(?:\.\d+)?)(px)?$/i;
function parseLength(value: string | undefined): number | undefined {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    const match = LENGTH_RE.exec(trimmed);
    if (!match)
        return undefined;
    const parsed = parseFloat(match[1]);
    if (!Number.isFinite(parsed) || parsed <= 0)
        return undefined;
    return parsed;
}
const VIEWBOX_RE = /viewBox\s*=\s*["']?\s*(-?[\d.]+)[,\s]+(-?[\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)\s*["']?/i;
export function parseSvgDimensions(svg: string): SvgDimensions {
    const svgTag = svg.match(/<svg\b[^>]*>/i)?.[0];
    const widthAttr = svgTag?.match(/\bwidth\s*=\s*["']?([^"'\s>]+)["']?/i)?.[1];
    const heightAttr = svgTag?.match(/\bheight\s*=\s*["']?([^"'\s>]+)["']?/i)?.[1];
    const width = parseLength(widthAttr);
    const height = parseLength(heightAttr);
    const viewBox = VIEWBOX_RE.exec(svg);
    const viewBoxWidth = viewBox ? parseFloat(viewBox[3]) : undefined;
    const viewBoxHeight = viewBox ? parseFloat(viewBox[4]) : undefined;
    if (width && height)
        return { width, height };
    if (viewBoxWidth && viewBoxHeight)
        return { width: viewBoxWidth, height: viewBoxHeight };
    return { width, height };
}
export class OutputTooLargeError extends Error {
    readonly side: "width" | "height";
    readonly requested: number;
    constructor(side: "width" | "height", requested: number) {
        super(`Output ${side} of ${requested}px exceeds the maximum of ${MAX_OUTPUT_SIZE}px`);
        this.name = "OutputTooLargeError";
        this.side = side;
        this.requested = requested;
    }
}
export interface TargetSizeInput {
    width?: number;
    height?: number;
    scale?: number;
}
export interface TargetSize {
    width?: number;
    height?: number;
    fit: "contain" | "inside";
}
export function computeTargetSize(dims: SvgDimensions, options: TargetSizeInput): TargetSize {
    const scale = options.scale ?? 2;
    let targetWidth: number | undefined;
    let targetHeight: number | undefined;
    let fit: "contain" | "inside" = "inside";
    if (options.width && options.height) {
        targetWidth = Math.round(options.width);
        targetHeight = Math.round(options.height);
        fit = "contain";
    }
    else if (options.width) {
        targetWidth = Math.round(options.width);
        if (dims.width && dims.height) {
            targetHeight = Math.round((targetWidth / dims.width) * dims.height);
        }
    }
    else if (dims.width && dims.height) {
        targetWidth = Math.round(dims.width * scale);
        targetHeight = Math.round(dims.height * scale);
    }
    if (targetWidth !== undefined && targetWidth > MAX_OUTPUT_SIZE) {
        throw new OutputTooLargeError("width", targetWidth);
    }
    if (targetHeight !== undefined && targetHeight > MAX_OUTPUT_SIZE) {
        throw new OutputTooLargeError("height", targetHeight);
    }
    return { width: targetWidth, height: targetHeight, fit };
}
