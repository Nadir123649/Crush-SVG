import { describe, it, expect, vi } from 'vitest'

import {
  subscribe,
  unsubscribe,
  publishLogout,
  type SseController,
} from '@/lib/session-broker'

function fakeController(): SseController & { chunks: string[]; closed: boolean } {
  const chunks: string[] = []
  let closed = false
  const controller = {
    chunks,
    enqueue: vi.fn((chunk: string) => {
      chunks.push(chunk)
      return true
    }),
    close: vi.fn(() => {
      closed = true
    }),
  }
  return {
    ...controller,
    get closed() {
      return closed
    },
  }
}

describe('session-broker', () => {
  it('publishLogout enqueues logout frame, closes controllers, returns count', () => {
    const first = fakeController()
    const second = fakeController()
    subscribe('user-1', first)
    subscribe('user-1', second)

    const count = publishLogout('user-1')

    expect(count).toBe(2)
    expect(first.chunks).toEqual(['data: logout\n\n'])
    expect(second.chunks).toEqual(['data: logout\n\n'])
    expect(first.closed).toBe(true)
    expect(second.closed).toBe(true)
    expect(publishLogout('user-1')).toBe(0)
  })

  it('unsubscribe removes a controller and drops the entry when empty', () => {
    const controller = fakeController()
    subscribe('user-2', controller)
    unsubscribe('user-2', controller)
    expect(publishLogout('user-2')).toBe(0)
  })

  it('unsubscribe removes only the given controller', () => {
    const first = fakeController()
    const second = fakeController()
    subscribe('user-3', first)
    subscribe('user-3', second)
    unsubscribe('user-3', first)
    expect(publishLogout('user-3')).toBe(1)
    expect(first.closed).toBe(false)
    expect(second.closed).toBe(true)
  })

  it('publishLogout returns 0 when nobody is subscribed', () => {
    expect(publishLogout('user-4')).toBe(0)
  })

  it('keeps subscribers of different users isolated', () => {
    const first = fakeController()
    const second = fakeController()
    subscribe('user-5', first)
    subscribe('user-6', second)
    expect(publishLogout('user-5')).toBe(1)
    expect(first.closed).toBe(true)
    expect(second.closed).toBe(false)
    expect(publishLogout('user-6')).toBe(1)
  })

  it('resubscribing after publishLogout works for the same user', () => {
    const first = fakeController()
    subscribe('user-7', first)
    expect(publishLogout('user-7')).toBe(1)
    const again = fakeController()
    subscribe('user-7', again)
    expect(publishLogout('user-7')).toBe(1)
    expect(again.chunks).toEqual(['data: logout\n\n'])
  })
})
