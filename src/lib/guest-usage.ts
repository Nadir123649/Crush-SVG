import 'server-only'

import { ObjectId, type Collection } from 'mongodb'

import { getMongoClient } from '@/lib/db'

export interface GuestUsageDoc {
  _id: string
  conversionsUsed: number
  createdAt: Date
  updatedAt: Date
}

let guestUsageIndexesEnsured = false

async function ensureIndexes(c: Collection<GuestUsageDoc>): Promise<void> {
  if (guestUsageIndexesEnsured) return
  await c.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })
  guestUsageIndexesEnsured = true
}

export async function getGuestUsageCollection(): Promise<Collection<GuestUsageDoc>> {
  const client = getMongoClient()
  const collection = client.db('crushsvg').collection<GuestUsageDoc>('guest_usage')
  await ensureIndexes(collection)
  return collection
}

export async function getGuestUsage(guestId: string): Promise<number> {
  const collection = await getGuestUsageCollection()
  const record = await collection.findOne({ _id: guestId })
  return record?.conversionsUsed ?? 0
}

export async function incrementGuestUsage(guestId: string): Promise<number> {
  const collection = await getGuestUsageCollection()
  const result = await collection.findOneAndUpdate(
    { _id: guestId },
    {
      $inc: { conversionsUsed: 1 },
      $setOnInsert: { _id: guestId, createdAt: new Date() },
      $set: { updatedAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  )
  return result?.conversionsUsed ?? 1
}