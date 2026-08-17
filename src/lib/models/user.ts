import 'server-only'

import { Schema, model, type Model, type Types } from 'mongoose'

export interface UserDoc {
  _id: Types.ObjectId
  uid: string
  email: string | null
  displayName: string
  name?: string | null
  photoURL: string | null
  providers: string[]
  linkedProviders?: string[]
  password?: string
  isVerified?: boolean
  emailVerificationToken?: string
  emailVerificationTokenExpire?: number
  resetPasswordToken?: string
  resetPasswordTokenExpire?: number
  conversionsUsed: number
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date
}

const userSchema = new Schema(
  {
    uid: { type: String, required: true },
    email: { type: String, default: null },
    displayName: { type: String, required: true },
    name: { type: String },
    photoURL: { type: String, default: null },
    providers: { type: [String], default: [] },
    linkedProviders: { type: [String] },
    password: { type: String },
    isVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationTokenExpire: { type: Number },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpire: { type: Number },
    conversionsUsed: { type: Number, default: 0 },
    lastLoginAt: { type: Date, required: true },
  },
  { timestamps: true }
)

userSchema.index({ uid: 1 }, { unique: true })
userSchema.index({ email: 1 }, { unique: true, sparse: true })

declare global {
  var __crushSvgUserModel: Model<UserDoc> | undefined
}

export const User = (globalThis.__crushSvgUserModel ??= model<UserDoc>('User', userSchema))
