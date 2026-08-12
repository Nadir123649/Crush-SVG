import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getUsersCollection: vi.fn(),
  usersFindOne: vi.fn(),
  toUserDTO: vi.fn(),
}))

vi.mock('@/lib/auth-middleware', () => ({ auth: mocks.auth }))
vi.mock('@/lib/db', () => ({ getUsersCollection: mocks.getUsersCollection }))
vi.mock('@/lib/auth', () => ({ toUserDTO: mocks.toUserDTO }))

import { GET } from './route'

const USER_ID = '507f1f77bcf86cd799439011'

const USER_DOC = {
  _id: new ObjectId(USER_ID),
  uid: 'uid-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  photoURL: 'https://example.com/a.png',
  providers: ['google'],
  conversionsUsed: 2,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastLoginAt: new Date('2026-01-02T00:00:00.000Z'),
}

const USER_DTO = {
  uid: 'uid-1',
  email: 'alice@example.com',
  displayName: 'Alice',
  photoURL: 'https://example.com/a.png',
  providers: ['google'],
  conversionsUsed: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: '2026-01-02T00:00:00.000Z',
}

function get() {
  return GET(
    new NextRequest('http://localhost/api/me', {
      method: 'GET',
      headers: { authorization: 'Bearer access-token' },
    })
  )
}

function okWho() {
  return { user: { id: USER_ID, role: 'free' } }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue(okWho())
  mocks.getUsersCollection.mockResolvedValue({ findOne: mocks.usersFindOne })
  mocks.usersFindOne.mockResolvedValue(USER_DOC)
  mocks.toUserDTO.mockReturnValue(USER_DTO)
})

describe('GET /api/me', () => {
  it('passes through the auth error when the bearer token is rejected', async () => {
    mocks.auth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })
    const res = await get()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
    expect(mocks.usersFindOne).not.toHaveBeenCalled()
  })

  it('returns 404 when the authenticated user has no document', async () => {
    mocks.usersFindOne.mockResolvedValue(null)
    const res = await get()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'User not found' })
  })

  it('looks up the user by the authenticated id', async () => {
    await get()
    expect(mocks.usersFindOne).toHaveBeenCalledWith({
      _id: new ObjectId(USER_ID),
    })
  })

  it('returns 200 with the user DTO', async () => {
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user).toEqual(USER_DTO)
    expect(mocks.toUserDTO).toHaveBeenCalledWith(USER_DOC)
  })
})
