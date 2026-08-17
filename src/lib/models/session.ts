import 'server-only'

import mongoose, { type Model, type Types } from 'mongoose'

const { Schema, model } = mongoose
const { ObjectId } = mongoose.Schema.Types

export type SessionStatus = 'active' | 'logged_out' | 'revoked'

export interface SessionDoc {
  _id: Types.ObjectId
  userId: Types.ObjectId
  provider: string
  remember: boolean
  tokenVersion: number
  status: SessionStatus
  rotatedAt: Date | null
  lastSeenAt: Date
  browser?: string
  os?: string
  deviceType?: string
  ip?: string
  userAgent?: string
  createdAt: Date
  updatedAt: Date
}

const sessionSchema = new Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true },
    remember: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'logged_out', 'revoked'], default: 'active' },
    rotatedAt: { type: Date, default: null },
    lastSeenAt: { type: Date, required: true },
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
)

sessionSchema.index({ userId: 1, deviceType: 1, browser: 1, os: 1 })
sessionSchema.index({ lastSeenAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })

declare global {
  var __crushSvgSessionModel: Model<SessionDoc> | undefined
}

export const Session = (globalThis.__crushSvgSessionModel ??= model<SessionDoc>('Session', sessionSchema))
