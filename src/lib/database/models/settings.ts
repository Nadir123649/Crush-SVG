import "server-only";
import { Schema, model, type Model, type Types } from "mongoose";

export interface SettingsDoc {
    _id: Types.ObjectId;
    siteName: string;
    supportEmail: string;
    logoUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const settingsSchema = new Schema<SettingsDoc>(
    {
        siteName: { type: String, default: "CrushSVG Production" },
        supportEmail: { type: String, default: "support@crushsvg.net" },
        logoUrl: { type: String, default: "" },
    },
    {
        timestamps: true,
        collection: "settings",
    }
);

export const Settings = (globalThis as any).__mongooseSettings || model<SettingsDoc>("Settings", settingsSchema);
(globalThis as any).__mongooseSettings = Settings;
