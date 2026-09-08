import "server-only";
import { pipeline, env } from "@huggingface/transformers";
import sharp from "sharp";

env.allowRemoteModels = true;
env.allowLocalModels = true;
env.useFSCache = true;
env.useBrowserCache = false;

const MODEL_ID = "Xenova/modnet";
const WORKING_SIZE = 512;

const SVG_BG_REMOVE_LIMITS = {
    MIN_DIMENSION: 8,
    MAX_DIMENSION: 8000,
    MAX_PIXELS: 20_000_000,
} as const;

const COLOR_DISTANCE_THRESHOLD = 35;

function shouldUseModnetEngine(): boolean {
    const val = process.env.BG_REMOVE_USE_MODNET;
    if (val === undefined || val === "") return true;
    return val === "true" || val === "1";
}

// ── Classifier (mirrors src/lib/bg-remove/classify.ts) ────────────────
type ImageClassification = "photo" | "graphic";

function quantize(v: number): number {
    return (v >> 3) & 0x1f;
}
function colorKey(r: number, g: number, b: number): number {
    return (quantize(r) << 10) | (quantize(g) << 5) | quantize(b);
}
function hue(r: number, g: number, b: number): number {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;
    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const d = max - min;
    if (d === 0) return 0;
    let h = 0;
    if (max === rf) h = ((gf - bf) / d) % 6;
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    return h;
}
function saturation(r: number, g: number, b: number): number {
    const rf = r / 255;
    const gf = g / 255;
    const bf = b / 255;
    const max = Math.max(rf, gf, bf);
    const min = Math.min(rf, gf, bf);
    const l = (max + min) / 2;
    if (max === min) return 0;
    const d = max - min;
    return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

function computeStats(data: Uint8ClampedArray, w: number, h: number) {
    const totalPixels = w * h;
    const targetSamples = 64_000;
    const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / targetSamples)));

    const colorSet = new Set<number>();
    let sampledCount = 0;
    let skinCount = 0;

    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            const i = (y * w + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a === 0) continue;
            colorSet.add(colorKey(r, g, b));
            sampledCount++;

            const h2 = hue(r, g, b);
            const s = saturation(r, g, b);
            const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            if (h2 <= 50 && s >= 0.15 && s <= 0.80 && l >= 0.20 && l <= 0.85) {
                skinCount++;
            }
        }
    }

    const uniqueColorRatio = sampledCount > 0 ? colorSet.size / sampledCount : 0;
    const skinToneRatio = sampledCount > 0 ? skinCount / sampledCount : 0;

    let gradientSum = 0;
    let gradientCount = 0;
    const margin = Math.max(1, Math.floor(Math.min(w, h) * 0.02));
    const gridStep = Math.max(step, Math.floor(Math.sqrt(totalPixels / 16_000)));

    for (let y = margin; y < h - margin; y += gridStep) {
        for (let x = margin; x < w - margin; x += gridStep) {
            const i = (y * w + x) * 4;
            const iRight = (y * w + (x + 1)) * 4;
            const iDown = ((y + 1) * w + x) * 4;
            const lumC = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const lumR = data[iRight] * 0.299 + data[iRight + 1] * 0.587 + data[iRight + 2] * 0.114;
            const lumD = data[iDown] * 0.299 + data[iDown + 1] * 0.587 + data[iDown + 2] * 0.114;
            gradientSum += Math.abs(lumR - lumC) + Math.abs(lumD - lumC);
            gradientCount++;
        }
    }
    const avgGradientMagnitude = gradientCount > 0 ? gradientSum / gradientCount : 0;

    let localVarSum = 0;
    let localVarCount = 0;
    const patchStep = Math.max(step, Math.floor(Math.sqrt(totalPixels / 8_000)));

    for (let y = margin + 1; y < h - margin - 1; y += patchStep) {
        for (let x = margin + 1; x < w - margin - 1; x += patchStep) {
            const lums: number[] = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const pi = ((y + dy) * w + (x + dx)) * 4;
                    lums.push(data[pi] * 0.299 + data[pi + 1] * 0.587 + data[pi + 2] * 0.114);
                }
            }
            const mean = lums.reduce((a, b) => a + b, 0) / 9;
            const variance = lums.reduce((a, v) => a + (v - mean) ** 2, 0) / 9;
            localVarSum += variance;
            localVarCount++;
        }
    }
    const avgLocalVariance = localVarCount > 0 ? localVarSum / localVarCount : 0;

    const edgePixels: { r: number; g: number; b: number }[] = [];
    const edgeStep = Math.max(1, Math.floor(Math.max(w, h) / 40));

    for (let x = 0; x < w; x += edgeStep) {
        edgePixels.push({ r: data[x * 4], g: data[x * 4 + 1], b: data[x * 4 + 2] });
        const bi = ((h - 1) * w + x) * 4;
        edgePixels.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
    }
    for (let y = 0; y < h; y += edgeStep) {
        const li = (y * w) * 4;
        edgePixels.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
        const ri = (y * w + (w - 1)) * 4;
        edgePixels.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
    }

    let edgeUniformity = 0.5;
    if (edgePixels.length > 1) {
        let rSum = 0, gSum = 0, bSum = 0;
        for (const p of edgePixels) { rSum += p.r; gSum += p.g; bSum += p.b; }
        const rMean = rSum / edgePixels.length;
        const gMean = gSum / edgePixels.length;
        const bMean = bSum / edgePixels.length;
        let rVar = 0, gVar = 0, bVar = 0;
        for (const p of edgePixels) {
            rVar += (p.r - rMean) ** 2;
            gVar += (p.g - gMean) ** 2;
            bVar += (p.b - bMean) ** 2;
        }
        const edgeVariance = (rVar + gVar + bVar) / (3 * edgePixels.length);
        edgeUniformity = 1 - Math.min(1, Math.sqrt(edgeVariance) / 128);
    }

    return {
        uniqueColorRatio,
        avgGradientMagnitude,
        edgeUniformity,
        avgLocalVariance,
        skinToneRatio,
    };
}

function classifyImage(data: Uint8ClampedArray, w: number, h: number): ImageClassification {
    const stats = computeStats(data, w, h);
    let photoScore = 0;

    if (stats.skinToneRatio > 0.08) {
        photoScore += 5;
    } else if (stats.skinToneRatio > 0.03) {
        photoScore += 3;
    } else if (stats.skinToneRatio > 0.01) {
        photoScore += 1;
    }

    if (stats.avgLocalVariance > 300) {
        photoScore += 4;
    } else if (stats.avgLocalVariance > 100) {
        photoScore += 2;
    } else if (stats.avgLocalVariance > 40) {
        photoScore += 1;
    }

    if (stats.uniqueColorRatio > 0.35) {
        photoScore += 3;
    } else if (stats.uniqueColorRatio > 0.20) {
        photoScore += 2;
    } else if (stats.uniqueColorRatio > 0.12) {
        photoScore += 1;
    }

    if (stats.edgeUniformity > 0.85 && stats.avgLocalVariance < 50) {
        photoScore -= 3;
    } else if (stats.edgeUniformity > 0.85 && stats.avgLocalVariance < 100) {
        photoScore -= 1;
    }
    if (stats.edgeUniformity < 0.40) {
        photoScore += 2;
    }

    if (stats.avgGradientMagnitude > 3 && stats.uniqueColorRatio > 0.15) {
        photoScore += 1;
    }

    if (stats.uniqueColorRatio < 0.05 && stats.avgLocalVariance < 20) {
        photoScore -= 5;
    }

    return photoScore >= 4 ? "photo" : "graphic";
}

// ── Background color detection (mirrors src/lib/bg-remove/detect.ts) ─
interface DetectedBackground { r: number; g: number; b: number; coverage: number; }

function detectBackgroundColor(data: Uint8ClampedArray, w: number, h: number): DetectedBackground {
    const samples: { r: number; g: number; b: number }[] = [];

    const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
    for (const [x, y] of corners) {
        const i = (y * w + x) * 4;
        samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
    }

    for (let i = 0; i < 8; i++) {
        const t = Math.floor(((i + 1) / 9) * (w - 1));
        const ti = (0 * w + t) * 4;
        samples.push({ r: data[ti], g: data[ti + 1], b: data[ti + 2] });
        const bi = ((h - 1) * w + t) * 4;
        samples.push({ r: data[bi], g: data[bi + 1], b: data[bi + 2] });
        const li = (Math.floor((i * (h - 1)) / 7) * w + 0) * 4;
        samples.push({ r: data[li], g: data[li + 1], b: data[li + 2] });
        const ri = (Math.floor((i * (h - 1)) / 7) * w + (w - 1)) * 4;
        samples.push({ r: data[ri], g: data[ri + 1], b: data[ri + 2] });
    }

    const gridCols = Math.min(16, Math.max(4, Math.ceil(w / 128)));
    const gridRows = Math.min(16, Math.max(4, Math.ceil(h / 128)));
    for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
            const x = Math.round(((gx + 0.5) / gridCols) * (w - 1));
            const y = Math.round(((gy + 0.5) / gridRows) * (h - 1));
            const i = (y * w + x) * 4;
            samples.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
    }

    const clusters: { r: number; g: number; b: number; count: number }[] = [];
    for (const s of samples) {
        let merged = false;
        for (const c of clusters) {
            if (
                Math.abs(c.r - s.r) <= 10 &&
                Math.abs(c.g - s.g) <= 10 &&
                Math.abs(c.b - s.b) <= 10
            ) {
                c.r = (c.r * c.count + s.r) / (c.count + 1);
                c.g = (c.g * c.count + s.g) / (c.count + 1);
                c.b = (c.b * c.count + s.b) / (c.count + 1);
                c.count++;
                merged = true;
                break;
            }
        }
        if (!merged) clusters.push({ r: s.r, g: s.g, b: s.b, count: 1 });
    }

    clusters.sort((a, b) => b.count - a.count);
    const dominant = clusters[0];
    const coverage = dominant.count / samples.length;

    return {
        r: Math.round(dominant.r),
        g: Math.round(dominant.g),
        b: Math.round(dominant.b),
        coverage,
    };
}

function removeBackgroundByDistance(
    data: Uint8ClampedArray,
    w: number,
    h: number,
    bg: DetectedBackground,
    threshold = COLOR_DISTANCE_THRESHOLD,
): Uint8ClampedArray {
    const out = new Uint8ClampedArray(data);
    if (bg.coverage < 0.05) return out;
    const thresholdSq = threshold * threshold;
    for (let i = 0; i < out.length; i += 4) {
        const r = out[i];
        const g = out[i + 1];
        const b = out[i + 2];
        const a = out[i + 3];
        if (a === 0) continue;
        const dr = r - bg.r;
        const dg = g - bg.g;
        const db = b - bg.b;
        if (dr * dr + dg * dg + db * db <= thresholdSq) {
            out[i + 3] = 0;
        }
    }
    return out;
}

// ── MODNet engine (mirrors src/lib/bg-remove/modnet.ts) ────────────────
type RawImageResult = { width: number; height: number; data: Uint8Array };

let pipelinePromise: ((input: string) => Promise<RawImageResult | RawImageResult[]>) | null = null;
let initError: Error | null = null;

async function getPipeline() {
    if (pipelinePromise) return pipelinePromise;
    if (initError) throw initError;
    pipelinePromise = await pipeline("background-removal", MODEL_ID, {
        dtype: "fp32",
    }) as (input: string) => Promise<RawImageResult | RawImageResult[]>;
    return pipelinePromise;
}

async function writeTempPng(buffer: Buffer): Promise<string> {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const tmpDir = join(tmpdir(), "crushsvg-svg-bg-remove");
    await mkdir(tmpDir, { recursive: true });
    const tmpPath = join(
        tmpDir,
        `input-${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
    );
    await writeFile(tmpPath, buffer);
    return tmpPath;
}

async function cleanupTempFile(path: string): Promise<void> {
    try {
        const { unlink } = await import("node:fs/promises");
        await unlink(path);
    } catch {
        // best-effort cleanup
    }
}

async function runModnet(buffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
    const meta = await sharp(buffer, { animated: false }).metadata();
    const origWidth = meta.width ?? 0;
    const origHeight = meta.height ?? 0;
    if (!origWidth || !origHeight) {
        throw new Error("Could not read image dimensions.");
    }
    if (origWidth < SVG_BG_REMOVE_LIMITS.MIN_DIMENSION || origHeight < SVG_BG_REMOVE_LIMITS.MIN_DIMENSION) {
        throw new Error("Image is too small to process.");
    }
    if (origWidth > SVG_BG_REMOVE_LIMITS.MAX_DIMENSION || origHeight > SVG_BG_REMOVE_LIMITS.MAX_DIMENSION) {
        throw new Error(`Image dimension exceeds the ${SVG_BG_REMOVE_LIMITS.MAX_DIMENSION}px limit.`);
    }

    let workingBuffer = buffer;
    const pixels = origWidth * origHeight;
    if (pixels > SVG_BG_REMOVE_LIMITS.MAX_PIXELS) {
        const scale = Math.sqrt(SVG_BG_REMOVE_LIMITS.MAX_PIXELS / pixels);
        const targetW = Math.max(SVG_BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(origWidth * scale));
        const targetH = Math.max(SVG_BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(origHeight * scale));
        workingBuffer = await sharp(workingBuffer, { animated: false })
            .resize(targetW, targetH, { fit: "inside", withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
            .png()
            .toBuffer();
    }

    const padded = await sharp(workingBuffer, { animated: false })
        .ensureAlpha()
        .resize(WORKING_SIZE, WORKING_SIZE, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
            kernel: sharp.kernel.lanczos3,
        })
        .png()
        .toBuffer();

    let bgRemovalPipeline;
    try {
        bgRemovalPipeline = await getPipeline();
    } catch (error) {
        initError = error instanceof Error ? error : new Error(String(error));
        throw new Error(`Failed to initialize MODNet model: ${initError.message}`);
    }

    let rawResult: RawImageResult | RawImageResult[] | null = null;
    let tmpPath: string | null = null;
    try {
        tmpPath = await writeTempPng(padded);
        rawResult = await bgRemovalPipeline(tmpPath);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`MODNet inference failed: ${msg}`);
    } finally {
        if (tmpPath) await cleanupTempFile(tmpPath);
    }

    if (!rawResult) throw new Error("MODNet returned no result.");

    // transformers.js v4 may return an array of RawImage or a single RawImage
    const resultImage: RawImageResult = Array.isArray(rawResult) ? rawResult[0] : rawResult;

    if (!resultImage) throw new Error("MODNet returned an empty result set.");

    const resultWidth = resultImage.width;
    const resultHeight = resultImage.height;
    const resultData = resultImage.data;
    if (!resultData || !resultWidth || !resultHeight) throw new Error("MODNet returned invalid image data.");

    const alphaChannel = await sharp(Buffer.from(resultData), {
        raw: { width: resultWidth, height: resultHeight, channels: 4 },
    })
        .extractChannel(3)
        .raw()
        .toBuffer();

    const contentAspect = origWidth / origHeight;
    let contentW: number;
    let contentH: number;
    let padX: number;
    let padY: number;
    if (contentAspect >= 1) {
        contentH = resultHeight;
        contentW = Math.round(resultHeight * contentAspect);
        if (contentW > resultWidth) {
            contentW = resultWidth;
            contentH = Math.round(resultWidth / contentAspect);
        }
        padX = Math.round((resultWidth - contentW) / 2);
        padY = Math.round((resultHeight - contentH) / 2);
    } else {
        contentW = resultWidth;
        contentH = Math.round(resultWidth / contentAspect);
        if (contentH > resultHeight) {
            contentH = resultHeight;
            contentW = Math.round(resultHeight * contentAspect);
        }
        padX = Math.round((resultWidth - contentW) / 2);
        padY = Math.round((resultHeight - contentH) / 2);
    }
    contentW = Math.min(contentW, resultWidth - padX);
    contentH = Math.min(contentH, resultHeight - padY);

    const resizedAlpha = await sharp(alphaChannel, {
        raw: { width: resultWidth, height: resultHeight, channels: 1 },
    })
        .extract({ left: padX, top: padY, width: contentW, height: contentH })
        .resize(origWidth, origHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
        .toColourspace("b-w")
        .raw()
        .toBuffer();

    const originalRaw = await sharp(buffer, { animated: false })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const combined = new Uint8ClampedArray(origWidth * origHeight * 4);
    for (let i = 0; i < origWidth * origHeight; i++) {
        const idx = i * 4;
        combined[idx] = originalRaw.data[idx];
        combined[idx + 1] = originalRaw.data[idx + 1];
        combined[idx + 2] = originalRaw.data[idx + 2];
        combined[idx + 3] = resizedAlpha[i];
    }

    const outputBuffer = await sharp(Buffer.from(combined), {
        raw: { width: origWidth, height: origHeight, channels: 4 },
    })
        .png({ compressionLevel: 7, adaptiveFiltering: true })
        .toBuffer();

    return { buffer: outputBuffer, width: origWidth, height: origHeight };
}

async function runColorDistance(buffer: Buffer): Promise<{ buffer: Buffer; width: number; height: number }> {
    const meta = await sharp(buffer, { animated: false }).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) throw new Error("Could not read image dimensions.");
    if (w < SVG_BG_REMOVE_LIMITS.MIN_DIMENSION || h < SVG_BG_REMOVE_LIMITS.MIN_DIMENSION) {
        throw new Error("Image is too small to process.");
    }
    if (w > SVG_BG_REMOVE_LIMITS.MAX_DIMENSION || h > SVG_BG_REMOVE_LIMITS.MAX_DIMENSION) {
        throw new Error(`Image dimension exceeds the ${SVG_BG_REMOVE_LIMITS.MAX_DIMENSION}px limit.`);
    }

    let workingBuffer = buffer;
    const pixels = w * h;
    if (pixels > SVG_BG_REMOVE_LIMITS.MAX_PIXELS) {
        const scale = Math.sqrt(SVG_BG_REMOVE_LIMITS.MAX_PIXELS / pixels);
        const targetW = Math.max(SVG_BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(w * scale));
        const targetH = Math.max(SVG_BG_REMOVE_LIMITS.MIN_DIMENSION, Math.round(h * scale));
        workingBuffer = await sharp(workingBuffer, { animated: false })
            .resize(targetW, targetH, { fit: "inside", withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
            .png()
            .toBuffer();
    }

    const processed = await sharp(workingBuffer, { animated: false })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const rawData = new Uint8ClampedArray(processed.data.buffer, processed.data.byteOffset, processed.data.byteLength);
    const W = processed.info.width;
    const H = processed.info.height;

    const bg = detectBackgroundColor(rawData, W, H);
    const resultPixels = removeBackgroundByDistance(rawData, W, H, bg);

    const outputBuffer = await sharp(resultPixels, {
        raw: { width: W, height: H, channels: 4 },
    })
        .png({ compressionLevel: 7, adaptiveFiltering: true })
        .toBuffer();
    return { buffer: outputBuffer, width: W, height: H };
}

export interface SvgBgRemoveResult {
    buffer: Buffer;
    width: number;
    height: number;
}

/**
 * SVG→PNG transparent-background engine. Independent of the Dedicated
 * Background Remover (src/lib/bg-remove/**), but mirrors its routing:
 * - photo → Xenova/modnet
 * - graphic → color-distance removal
 *
 * Lazy-loads the model; first photo classification pays init cost, subsequent
 * requests share the cached pipeline instance.
 */
export async function processSvgBackgroundRemove(buffer: Buffer): Promise<SvgBgRemoveResult> {
    if (!shouldUseModnetEngine()) {
        return runColorDistance(buffer);
    }

    const meta = await sharp(buffer, { animated: false }).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) {
        return runColorDistance(buffer);
    }

    const decoded = await sharp(buffer, { animated: false })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const rawData = new Uint8ClampedArray(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);

    const classification = classifyImage(rawData, w, h);
    if (classification === "photo") {
        try {
            return await runModnet(buffer);
        } catch {
            // MODNet failed — fall back to color-distance removal
            return runColorDistance(buffer);
        }
    }
    return runColorDistance(buffer);
}
