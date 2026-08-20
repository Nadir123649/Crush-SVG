import { describe, expect, it } from 'vitest'

import { mapTokenPayload } from '@/lib/firebase/firebase-token'

describe('mapTokenPayload', () => {
  it('maps a google ID token payload', () => {
    const token = mapTokenPayload({
      sub: 'uid-123',
      email: 'a@b.com',
      email_verified: true,
      name: 'Alice',
      picture: 'https://pic',
      firebase: {
        sign_in_provider: 'google.com',
        identities: { 'google.com': ['a@b.com'] },
      },
    })
    expect(token).toEqual({
      uid: 'uid-123',
      email: 'a@b.com',
      email_verified: true,
      name: 'Alice',
      picture: 'https://pic',
      firebase: {
        sign_in_provider: 'google.com',
        identities: { 'google.com': ['a@b.com'] },
      },
    })
  })

  it('defaults missing claims to null/false', () => {
    const token = mapTokenPayload({ sub: 'uid-1' })
    expect(token.email).toBeNull()
    expect(token.email_verified).toBe(false)
    expect(token.name).toBeNull()
    expect(token.picture).toBeNull()
    expect(token.firebase.sign_in_provider).toBe('')
  })

  it('throws when the subject is missing', () => {
    expect(() => mapTokenPayload({})).toThrow('missing subject')
  })
})