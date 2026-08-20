import 'server-only'

import dns from 'node:dns'
import { connect, type Connection } from 'mongoose'

import { User } from '@/lib/database/models/user'
import { Session } from '@/lib/database/models/session'
import { GuestUsage } from '@/lib/database/models/guest-usage'

export { User, Session, GuestUsage }

export type { UserDoc } from '@/lib/database/models/user'
export type { SessionDoc, SessionStatus } from '@/lib/database/models/session'
export type { GuestUsageDoc } from '@/lib/database/models/guest-usage'

declare global {
  var __crushSvgMongoose: Promise<Connection> | undefined
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI must be set')
  }
  return uri
}

export function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 11000
}

export async function connectToDatabase(): Promise<Connection> {
  const cached = globalThis.__crushSvgMongoose
  if (cached) return cached

  const dnsServers = process.env.DNS_SERVERS
  if (dnsServers) {
    dns.setServers(dnsServers.split(',').map((s) => s.trim()))
  }

  const dbName = process.env.MONGODB_DB_NAME || 'crushsvg'
  const maxPoolSize = Number(process.env.MONGODB_MAX_POOL_SIZE) || 10
  const promise = connect(getMongoUri(), {
    dbName,
    appName: 'crushsvg',
    serverSelectionTimeoutMS: 5000,
    maxPoolSize,
    minPoolSize: 0,
    maxIdleTimeMS: 60_000,
  })
    .then((conn) => {
      console.log('Connected to MongoDB successfully')
      return conn.connection
    })
    .catch((err) => {
      globalThis.__crushSvgMongoose = undefined
      console.error('Failed to connect to MongoDB:', err)
      throw err
    })

  globalThis.__crushSvgMongoose = promise
  return promise
}
