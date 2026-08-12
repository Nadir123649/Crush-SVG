import 'server-only'

import { MongoClient, type Collection, type Client, type MongoClientOptions } from 'mongodb'

export interface UserDoc {
  _id: import('mongodb').ObjectId
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

async function createClient(): Promise<MongoClient> {
  const client = new MongoClient(getMongoUri(), {
    appName: 'crushsvg',
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  })
  try {
    await client.connect()
    console.log('Connected to MongoDB successfully')
    return client
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err)
    throw err
  }
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
