import 'server-only'

import type { Types } from 'mongoose'

import { Session, type SessionDoc } from '@/lib/database/db'
import { parseUserAgent } from '@/lib/shared/user-agent'
import { geoLocate } from '@/lib/shared/geo'

export type { SessionDoc, SessionStatus } from '@/lib/database/db'

export type SessionUserId = Types.ObjectId | string

export const MAX_ACTIVE_SESSIONS = 20

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
  const parsed = parseUserAgent(input.userAgent ?? null)
  const browser = input.browser ?? parsed.browser
  const os = input.os ?? parsed.os
  const deviceType = input.deviceType ?? parsed.deviceType
  const now = new Date()

  const created = await Session.create({
    userId: input.userId,
    provider: input.provider,
    remember: input.remember,
    tokenVersion: 0,
    status: 'active',
    rotatedAt: null,
    lastSeenAt: now,
    browser,
    os,
    deviceType,
    ip: input.ip,
    userAgent: input.userAgent,
  })
  const sessionId = created._id

  // Each login is its own session so users can sign out individual devices.
  // Cap concurrent active sessions to prevent unbounded growth.
  const activeCount = await Session.countDocuments({ userId: input.userId, status: 'active' })
  if (activeCount > MAX_ACTIVE_SESSIONS) {
    const oldest = await Session.find({ userId: input.userId, status: 'active' })
      .sort({ lastSeenAt: 1 })
      .limit(activeCount - MAX_ACTIVE_SESSIONS)
      .select('_id')
    const ids = oldest.map((s) => s._id)
    if (ids.length > 0) {
      await Session.updateMany({ _id: { $in: ids } }, { $set: { status: 'revoked' } })
    }
  }

  // Geo lookup is an external network call — never block session creation on it.
  // Fire-and-forget: fill in the location once the provider responds.
  if (input.ip) {
    void geoLocate(input.ip).then((location) => {
      if (location === 'Unknown Location') return
      void Session.updateOne({ _id: sessionId }, { $set: { location } }).catch(() => {})
    })
  }

  return created
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

export async function wasSessionRotatedWithin(sessionId: string, ms: number): Promise<boolean> {
  const doc = await Session.findById(sessionId)
  if (!doc?.rotatedAt) return false
  return Date.now() - doc.rotatedAt.getTime() < ms
}

export async function rotateSession(
  sessionId: string,
  expectedVersion: number,
  userId: SessionUserId
): Promise<{ rotated: boolean; currentVersion: number; remember: boolean }> {
  const updated = await Session.findOneAndUpdate(
    { _id: sessionId, userId, tokenVersion: expectedVersion, status: 'active' },
    { $inc: { tokenVersion: 1 }, $set: { rotatedAt: new Date(), lastSeenAt: new Date() } },
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
