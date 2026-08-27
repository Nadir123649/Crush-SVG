import "server-only";
import { ConversionLog } from "@/lib/database/db";

export async function logConversion(params: {
    userId?: string | null;
    guestId?: string | null;
    inputFormat: string;
    outputFormat: string;
    originalSize?: number | null;
    success: boolean;
    errorReason?: string | null;
}) {
    try {
        await ConversionLog.create({
            userId: params.userId || null,
            guestId: params.guestId || null,
            inputFormat: params.inputFormat,
            outputFormat: params.outputFormat,
            originalSize: params.originalSize ?? null,
            success: params.success,
            errorReason: params.errorReason || null,
        });
    } catch (error) {
        console.error("Failed to log conversion:", error);
    }
}
