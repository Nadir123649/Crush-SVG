import "server-only";
import { Schema, model, type Model, type Types } from "mongoose";

export interface AuditLogDoc {
    _id: Types.ObjectId;
    adminId: string;
    action: string;
    target?: string | null;
    resourceType?: string | null;
    resourceId?: string | null;
    details?: any;
    ipAddress?: string | null;
    metadata?: any;
    createdAt: Date;
}

const auditLogSchema = new Schema({
    adminId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    target: { type: String, default: null },
    resourceType: { type: String, default: null },
    resourceId: { type: String, default: null },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, index: true },
});

declare global {
    var __crushSvgAuditLogModel: Model<AuditLogDoc> | undefined;
}

export const AuditLog = (globalThis.__crushSvgAuditLogModel ??= model<AuditLogDoc>("AuditLog", auditLogSchema));
