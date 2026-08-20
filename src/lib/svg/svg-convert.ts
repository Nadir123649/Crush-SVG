import "server-only";
import sharp from "sharp";
import { ensureFontConfig } from "@/lib/svg/font-config";
import { sanitizeSvg } from "@/lib/svg/svg-sanitize";
import { computeTargetSize, parseSvgDimensions, type SvgDimensions, type TargetSize } from "@/lib/svg/svg-dims";
import { ConversionTimeoutError } from "@/lib/svg/svg-errors";
const BASE_DPI = 72;
const INPUT_PIXEL_BUDGET = 50000000;
function computeSvgDensity(dims: SvgDimensions, target: TargetSize): number {
    let density = 300;
    if (dims.width && dims.height) {
        const renderScale = Math.max(target.width && dims.width ? target.width / dims.width : 1, target.height && dims.height ? target.height / dims.height : 1);
        if (renderScale > 1) {
            density = BASE_DPI * renderScale;
        }
        const budgetDensity = BASE_DPI * Math.sqrt(INPUT_PIXEL_BUDGET / (dims.width * dims.height));
        density = Math.min(density, budgetDensity);
        density = Math.max(density, BASE_DPI);
    }
    return density;
}
export type SvgFormat = "png";
export interface SvgConvertOptions {
    width?: number;
    height?: number;
    scale?: number;
    transparent?: boolean;
    quality?: number;
}
export interface SvgConvertResult {
    buffer: Buffer;
    width?: number;
    height?: number;
    format: SvgFormat;
    warnings: string[];
}
export const CONVERSION_TIMEOUT_MS = 30000;
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new ConversionTimeoutError()), ms);
        promise.then((value) => {
            clearTimeout(timer);
            resolve(value);
        }, (error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}
export async function convertSvg(svg: string, options: SvgConvertOptions = {}): Promise<SvgConvertResult> {
    ensureFontConfig();
    const sanitizedSvg = sanitizeSvg(svg);
    const dims = parseSvgDimensions(sanitizedSvg);
    const target = computeTargetSize(dims, options);
    const warnings: string[] = [];
    const pipeline = sharp(Buffer.from(sanitizedSvg, "utf-8"), {
        density: computeSvgDensity(dims, target),
        limitInputPixels: INPUT_PIXEL_BUDGET,
    });
    if (target.width) {
        pipeline.resize({
            width: target.width,
            height: target.height,
            fit: target.fit,
            withoutEnlargement: false,
            background: {
                r: 255,
                g: 255,
                b: 255,
                alpha: options.transparent === false ? 1 : 0,
            },
        });
    }
    if (options.transparent === false) {
        pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
    }
    pipeline.png({
        compressionLevel: 7,
        adaptiveFiltering: true,
    });
    const { data: buffer, info } = await withTimeout(pipeline.toBuffer({ resolveWithObject: true }), CONVERSION_TIMEOUT_MS);
    return { buffer, width: info.width, height: info.height, format: "png", warnings };
}
