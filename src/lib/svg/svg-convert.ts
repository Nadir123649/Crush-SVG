import "server-only";
import sharp from "sharp";
import { ensureFontConfig } from "@/lib/svg/font-config";
import { sanitizeSvg } from "@/lib/svg/svg-sanitize";
import { computeTargetSize, parseSvgDimensions, type SvgDimensions, type TargetSize } from "@/lib/svg/svg-dims";
import { ConversionTimeoutError } from "@/lib/svg/svg-errors";
import { processBackgroundRemoveFromRaw } from "@/lib/bg-remove/process";

const BASE_DPI = 72;
const INPUT_PIXEL_BUDGET = 50000000;

function computeSvgDensity(dims: SvgDimensions, target: TargetSize): number {
    if (dims.width && dims.height) {
        const renderScale = Math.max(
            target.width && dims.width ? target.width / dims.width : 1,
            target.height && dims.height ? target.height / dims.height : 1,
        );
        let density = BASE_DPI * renderScale;
        const budgetDensity = BASE_DPI * Math.sqrt(INPUT_PIXEL_BUDGET / (dims.width * dims.height));
        density = Math.min(density, budgetDensity);
        density = Math.max(density, BASE_DPI);
        return density;
    }
    return 300;
}

export type SvgFormat = "png";

export interface SvgConvertOptions {
    width?: number;
    height?: number;
    scale?: number;
    transparent?: boolean;
    quality?: number;
    bgOption?: "Transparent" | "White" | "Black" | "Custom";
    bgColor?: string;
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
    if (!sanitizedSvg.startsWith("<")) {
        console.error(
            "SVG sanitization produced non-SVG output (starts with):",
            JSON.stringify(sanitizedSvg.substring(0, 60)),
        );
    }
    const dims = parseSvgDimensions(sanitizedSvg);
    const target = computeTargetSize(dims, options);
    const warnings: string[] = [];

    const resolvedBgOption = options.bgOption ?? (options.transparent === false ? "White" : "Transparent");

    // Fast path: solid white background
    if (resolvedBgOption === "White") {
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
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            });
        }
        pipeline.flatten({ background: { r: 255, g: 255, b: 255 } });
        pipeline.png({
            compressionLevel: 3,
            adaptiveFiltering: true,
        });
        const { data: buffer, info } = await withTimeout(
            pipeline.toBuffer({ resolveWithObject: true }),
            CONVERSION_TIMEOUT_MS,
        );
        return { buffer, width: info.width, height: info.height, format: "png", warnings };
    }

    // Transparent, Custom, or Black background: render to raw RGBA and pass directly
    // to the bg-remove engine, skipping an intermediate PNG encode+decode cycle.
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
                alpha: 0,
            },
        });
    }
    const { data: rawPixels, info } = await withTimeout(
        pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
        CONVERSION_TIMEOUT_MS,
    );

    const rawData = new Uint8ClampedArray(rawPixels.buffer, rawPixels.byteOffset, rawPixels.byteLength);

    try {
        const removed = await withTimeout(
            processBackgroundRemoveFromRaw(rawData, info.width, info.height, {
                bgOption: resolvedBgOption,
                bgColor: options.bgColor,
                scale: 100,
            }),
            CONVERSION_TIMEOUT_MS,
        );
        return {
            buffer: removed.buffer,
            width: removed.width,
            height: removed.height,
            format: "png",
            warnings,
        };
    } catch {
        // Fallback: encode raw pixels directly if background removal encounters an error
        const fallback = await sharp(rawPixels, { raw: { width: info.width, height: info.height, channels: 4 } })
            .png({ compressionLevel: 3, adaptiveFiltering: true })
            .toBuffer();
        return {
            buffer: fallback,
            width: info.width,
            height: info.height,
            format: "png",
            warnings,
        };
    }
}
