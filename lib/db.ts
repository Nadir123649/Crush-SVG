import 'server-only'

import { MongoClient, type Collection } from 'mongodb'

export interface UserDoc {
  _id: import('mongodb').ObjectId
  uid: string
  email: string | null
  displayName: string
  photoURL: string | null
  providers: string[]
  conversionsUsed: number
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date
}

declare global {
  var __crushSvgMongoClient: MongoClient | undefined
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI must be set')
  }
  return uri
}

function createClient(): MongoClient {
  const client = new MongoClient(getMongoUri(), {
    appName: 'crushsvg',
    serverSelectionTimeoutMS: 5000,
  })
  void client.connect().catch((err) => {
    console.error('Failed to connect to MongoDB:', err)
  })
  globalThis.__crushSvgMongoClient = client
  return client
}

export function getMongoClient(): MongoClient {
  const existing = globalThis.__crushSvgMongoClient
  if (existing) return existing
  return createClient()
}

export async function getUsersCollection(): Promise<Collection<UserDoc>> {
  const client = getMongoClient()
  const collection = client.db('crushsvg').collection<UserDoc>('users')
  await ensureIndexes(collection)
  return collection
}

let indexesEnsured = false

async function ensureIndexes(collection: Collection<UserDoc>): Promise<void> {
  if (indexesEnsured) return
  await collection.createIndex({ uid: 1 }, { unique: true })
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true })
  indexesEnsured = true
}
