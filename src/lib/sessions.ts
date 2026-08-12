import 'server-only'

import { ObjectId, type Collection } from 'mongodb'

import { getMongoClient } from '@/lib/db'

export type SessionStatus = 'active' | 'logged_out' | 'revoked'

export interface SessionDoc {
  _id: ObjectId
  userId: ObjectId
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
}

let sessionsIndexesEnsured = false

async function ensureIndexes(c: Collection<SessionDoc>): Promise<void> {
  if (sessionsIndexesEnsured) return
  await c.createIndex({ userId: 1 })
  await c.createIndex({ userId: 1, deviceType: 1, browser: 1, os: 1 })
  await c.createIndex({ lastSeenAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })
  sessionsIndexesEnsured = true
}

export async function getSessionsCollection(): Promise<Collection<SessionDoc>> {
  const client = getMongoClient()
  const collection = client.db('crushsvg').collection<SessionDoc>('sessions')
  await ensureIndexes(collection)
  return collection
}

export async function createSession(
  c: Collection<SessionDoc>,
  input: {
    userId: ObjectId
    provider: string
    remember: boolean
    ip?: string
    userAgent?: string
    browser?: string
    os?: string
    deviceType?: string
  }
): Promise<SessionDoc> {
  const fingerprint = {
    userId: input.userId,
    browser: input.browser,
    os: input.os,
    deviceType: input.deviceType,
  }
  const existing = await c.findOne({ ...fingerprint, status: 'active' })
  const now = new Date()

  if (existing) {
    await c.updateOne(
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
    return (await c.findOne({ _id: existing._id }))!
  }

  const doc: SessionDoc = {
    _id: new ObjectId(),
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
    createdAt: now,
  }
  await c.insertOne(doc)
  return doc
}

export async function listActiveSessions(
  c: Collection<SessionDoc>,
  userId: ObjectId
): Promise<SessionDoc[]> {
  return c
    .find({ userId, status: 'active' })
    .sort({ lastSeenAt: -1 })
    .toArray()
}

export async function revokeSession(
  c: Collection<SessionDoc>,
  sessionId: string,
  userId: ObjectId
): Promise<boolean> {
  const result = await c.updateOne(
    { _id: new ObjectId(sessionId), userId },
    { $set: { status: 'revoked' } }
  )
  return result.modifiedCount > 0
}

export async function revokeAllSessions(
  c: Collection<SessionDoc>,
  userId: ObjectId,
  status: 'logged_out' | 'revoked'
): Promise<void> {
  await c.updateMany({ userId, status: 'active' }, { $set: { status } })
}

export async function getSessionTokenVersion(
  c: Collection<SessionDoc>,
  sessionId: string
): Promise<number> {
  const doc = await c.findOne({ _id: new ObjectId(sessionId) })
  return doc?.tokenVersion ?? 0
}

export async function getSessionRemember(
  c: Collection<SessionDoc>,
  sessionId: string
): Promise<boolean> {
  const doc = await c.findOne({ _id: new ObjectId(sessionId) })
  return doc?.remember ?? true
}

export async function rotateSession(
  c: Collection<SessionDoc>,
  sessionId: string,
  expectedVersion: number,
  userId: ObjectId
): Promise<{ rotated: boolean; currentVersion: number; remember: boolean }> {
  const updated = await c.findOneAndUpdate(
    {
      _id: new ObjectId(sessionId),
      userId,
      tokenVersion: expectedVersion,
      status: 'active',
    },
    { $inc: { tokenVersion: 1 }, $set: { rotatedAt: new Date() } },
    { returnDocument: 'after' }
  )
  if (updated) {
    return {
      rotated: true,
      currentVersion: updated.tokenVersion,
      remember: updated.remember,
    }
  }

  const current = await c.findOne({
    _id: new ObjectId(sessionId),
  })
  if (!current || current.status !== 'active' || current.userId.toString() !== userId.toString()) {
    return { rotated: false, currentVersion: expectedVersion, remember: true }
  }
  return { rotated: false, currentVersion: current.tokenVersion, remember: current.remember }
}
