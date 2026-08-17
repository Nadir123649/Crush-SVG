import bcrypt from 'bcryptjs'
import { randomBytes, createHash } from 'crypto'

export const VERIFY_TOKEN_MINUTES = 24 * 60
export const RESET_TOKEN_MINUTES = 60

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
