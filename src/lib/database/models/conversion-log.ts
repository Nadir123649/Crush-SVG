import "server-only";
import { Schema, model, type Model, type Types } from "mongoose";

export interface ConversionLogDoc {
    _id: Types.ObjectId;
    userId?: string | null;
    guestId?: string | null;
    inputFormat: string;
    outputFormat: string;
    success: boolean;
    errorReason?: string | null;
    createdAt: Date;
}

const conversionLogSchema = new Schema({
    userId: { type: String, default: null, index: true },
    guestId: { type: String, default: null, index: true },
    inputFormat: { type: String, required: true },
    outputFormat: { type: String, required: true },
    success: { type: Boolean, required: true, default: true },
    errorReason: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
});

declare global {
    var __crushSvgConversionLogModel: Model<ConversionLogDoc> | undefined;
}

export const ConversionLog = (globalThis.__crushSvgConversionLogModel ??= model<ConversionLogDoc>("ConversionLog", conversionLogSchema));
