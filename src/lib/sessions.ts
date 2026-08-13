import 'server-only'

import type { Types } from 'mongoose'

import { Session, type SessionDoc } from '@/lib/db'

export type { SessionDoc, SessionStatus } from '@/lib/db'

export type SessionUserId = Types.ObjectId | string

export async function createSession(input: {
  userId: SessionUserId
  provider: string
  remember: boolean
  ip?: string
  userAgent?: string
  browser?: string
  os?: string
  deviceType?: string
}): Promise<SessionDoc> {
  const fingerprint = {
    userId: input.userId,
    browser: input.browser,
    os: input.os,
    deviceType: input.deviceType,
  }
  const existing = await Session.findOne({ ...fingerprint, status: 'active' })
  const now = new Date()

  if (existing) {
    await Session.updateOne(
      { _id: existing._id },
      {
        $set: {
          provider: existing.provider,
          remember: input.remember,
          createdAt: now,
          lastSeenAt: now,
          ip: input.ip,
          userAgent: input.userAgent,
        },
      }
    )
    return (await Session.findOne({ _id: existing._id }))!
  }

  return Session.create({
    userId: input.userId,
    provider: input.provider,
    remember: input.remember,
    tokenVersion: 0,
    status: 'active',
    rotatedAt: null,
    lastSeenAt: now,
    browser: input.browser,
    os: input.os,
    deviceType: input.deviceType,
    ip: input.ip,
    userAgent: input.userAgent,
  })
}

export interface SessionPage {
  docs: SessionDoc[]
  total: number
}

export async function listActiveSessions(
  userId: SessionUserId,
  page = 1,
  limit = 20
): Promise<SessionPage> {
  const skip = (page - 1) * limit
  const [total, docs] = await Promise.all([
    Session.countDocuments({ userId, status: 'active' }),
    Session.find({ userId, status: 'active' })
      .sort({ lastSeenAt: -1 })
      .skip(skip)
      .limit(limit),
  ])
  return { docs, total }
}

export async function revokeSession(sessionId: string, userId: SessionUserId): Promise<boolean> {
  const result = await Session.updateOne(
    { _id: sessionId, userId },
    { $set: { status: 'revoked' } }
  )
  return result.modifiedCount > 0
}

export async function revokeAllSessions(
  userId: SessionUserId,
  status: 'logged_out' | 'revoked'
): Promise<void> {
  await Session.updateMany({ userId, status: 'active' }, { $set: { status } })
}

export async function getSessionTokenVersion(sessionId: string): Promise<number> {
  const doc = await Session.findById(sessionId)
  return doc?.tokenVersion ?? 0
}

export async function getSessionRemember(sessionId: string): Promise<boolean> {
  const doc = await Session.findById(sessionId)
  return doc?.remember ?? true
}

export async function rotateSession(
  sessionId: string,
  expectedVersion: number,
  userId: SessionUserId
): Promise<{ rotated: boolean; currentVersion: number; remember: boolean }> {
  const updated = await Session.findOneAndUpdate(
    { _id: sessionId, userId, tokenVersion: expectedVersion, status: 'active' },
    { $inc: { tokenVersion: 1 }, $set: { rotatedAt: new Date() } },
    { new: true }
  )
  if (updated) {
    return {
      rotated: true,
      currentVersion: updated.tokenVersion,
      remember: updated.remember,
    }
  }

  const current = await Session.findById(sessionId)
  if (!current || current.status !== 'active' || current.userId.toString() !== userId.toString()) {
    return { rotated: false, currentVersion: expectedVersion, remember: true }
  }
  return { rotated: false, currentVersion: current.tokenVersion, remember: current.remember }
}
