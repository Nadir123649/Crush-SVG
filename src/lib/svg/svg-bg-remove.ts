import "server-only";
import sharp from "sharp";
import { processBackgroundRemove } from "@/lib/bg-remove/process";

export interface SvgBgRemoveResult {
    buffer: Buffer;
    width: number;
    height: number;
}

/**
 * Bridge to canonical Background Remover Engine (src/lib/bg-remove/process.ts).
 */
export async function processSvgBackgroundRemove(
    input: Buffer,
    width?: number,
    height?: number,
): Promise<SvgBgRemoveResult> {
    let pngBuffer = input;
    if (width && height && input.length === width * height * 4) {
        pngBuffer = await sharp(input, {
            raw: { width, height, channels: 4 },
        })
            .png({ compressionLevel: 3, adaptiveFiltering: true })
            .toBuffer();
    }
    const result = await processBackgroundRemove(pngBuffer, {
        bgOption: "Transparent",
        scale: 100,
    });
    return {
        buffer: result.buffer,
        width: result.width,
        height: result.height,
    };
}
