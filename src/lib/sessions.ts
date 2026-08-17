import 'server-only'

import type { Types } from 'mongoose'

import { Session, type SessionDoc } from '@/lib/db'
import { parseUserAgent } from '@/lib/user-agent'
import { geoLocate } from '@/lib/geo'

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
  const parsed = parseUserAgent(input.userAgent ?? null)
  const browser = input.browser ?? parsed.browser
  const os = input.os ?? parsed.os
  const deviceType = input.deviceType ?? parsed.deviceType

  const fingerprint = {
    userId: input.userId,
    browser,
    os,
    deviceType,
  }
  const existing = await Session.findOne({ ...fingerprint, status: 'active' })
  const now = new Date()

  let sessionId: Types.ObjectId

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
    sessionId = existing._id
  } else {
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
    sessionId = created._id
  }

  // Geo lookup is an external network call — never block session creation on it.
  // Fire-and-forget: fill in the location once the provider responds.
  if (input.ip) {
    void geoLocate(input.ip).then((location) => {
      if (location === 'Unknown Location') return
      void Session.updateOne({ _id: sessionId }, { $set: { location } }).catch(() => {})
    })
  }

  return (await Session.findById(sessionId))!
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
