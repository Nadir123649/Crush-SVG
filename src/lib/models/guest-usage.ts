import 'server-only'

import { Schema, model, type Model } from 'mongoose'

export interface GuestUsageDoc {
  _id: string
  conversionsUsed: number
  createdAt: Date
  updatedAt: Date
}

const guestUsageSchema = new Schema(
  {
    _id: { type: String, required: true },
    conversionsUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
)

guestUsageSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

declare global {
  var __crushSvgGuestUsageModel: Model<GuestUsageDoc> | undefined
}

export const GuestUsage = (globalThis.__crushSvgGuestUsageModel ??= model<GuestUsageDoc>('GuestUsage', guestUsageSchema))
