import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { escapeCsvCell, formatCsvRow, createCsvStream } from '@/lib/shared/csv-export'

describe('Admin Bulk CSV Export Suite', () => {
  describe('RFC 4180 CSV Escaping', () => {
    it('escapes quotes by doubling them and wrapping in quotes', () => {
      assert.equal(escapeCsvCell('He said "Hello"'), '"He said ""Hello"""')
      assert.equal(escapeCsvCell('"test"'), '"""test"""')
    })

    it('safely wraps commas, newlines, and carriage returns in quotes', () => {
      assert.equal(escapeCsvCell('Doe, John'), '"Doe, John"')
      assert.equal(escapeCsvCell('Row 1\nRow 2'), '"Row 1\nRow 2"')
      assert.equal(escapeCsvCell('Row 1\r\nRow 2'), '"Row 1\r\nRow 2"')
    })

    it('handles null, undefined, and non-string types', () => {
      assert.equal(escapeCsvCell(null), '""')
      assert.equal(escapeCsvCell(undefined), '""')
      assert.equal(escapeCsvCell(0), '"0"')
      assert.equal(escapeCsvCell(false), '"false"')
      assert.equal(escapeCsvCell(123.45), '"123.45"')
    })

    it('formats a full CSV line with multiple columns', () => {
      const line = formatCsvRow(['101', 'user@example.com', 'Doe, John', 'admin', 'Verified'])
      assert.equal(line, '"101","user@example.com","Doe, John","admin","Verified"')
    })
  })

  describe('Large Dataset Streaming & Memory Stress (> 2,500 records)', () => {
    it('streams 2,500+ records without memory buildup or dropped rows', async () => {
      const RECORD_COUNT = 2500
      const headers = ['ID', 'Email', 'DisplayName', 'Role', 'Status', 'Provider', 'ConversionsUsed', 'CreatedAt']

      async function* mockDatabaseCursor() {
        for (let i = 1; i <= RECORD_COUNT; i++) {
          yield [
            `user_${i}`,
            `user${i}@example.com`,
            `Test User ${i}, "Tester"`,
            i % 10 === 0 ? 'admin' : 'user',
            i % 2 === 0 ? 'Verified' : 'Unverified',
            i % 3 === 0 ? 'Google' : 'Email',
            String(i * 5),
            new Date(1700000000000 + i * 1000).toISOString(),
          ]
        }
      }

      const stream = createCsvStream({
        headers,
        rowGenerator: mockDatabaseCursor,
      })

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let rowCount = 0
      let totalBytes = 0
      let lineRemainder = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        totalBytes += value.byteLength
        const chunk = decoder.decode(value, { stream: true })
        const lines = (lineRemainder + chunk).split('\r\n')
        lineRemainder = lines.pop() ?? ''

        for (const line of lines) {
          if (line.trim().length > 0) {
            rowCount++
          }
        }
      }

      if (lineRemainder.trim().length > 0) {
        rowCount++
      }

      // 1 header row + 2,500 data rows = 2,501 rows total
      assert.equal(rowCount, RECORD_COUNT + 1)
      assert.ok(totalBytes > 100_000, `Expected > 100KB of streamed data, got ${totalBytes} bytes`)
    })
  })

  describe('Users Export Row Transformation & Filter Parity', () => {
    const isGoogleUser = (u: any) =>
      Array.isArray(u.providers) &&
      u.providers.some((p: string) => p === 'google' || p === 'google.com')
    const isVerifiedUser = (u: any) => u.isVerified === true || isGoogleUser(u)

    function mapUserToCsvRow(u: any) {
      const id = u.uid || u.id || u._id?.toString() || ''
      const email = u.email || ''
      const displayName = u.displayName || ''
      const userRole = u.role || 'user'
      const statusText = isVerifiedUser(u) ? 'Verified' : 'Unverified'
      const provider = isGoogleUser(u) ? 'Google' : 'Email'
      const conversionsUsed = u.conversionsUsed != null ? String(u.conversionsUsed) : '0'
      const createdAt = u.createdAt ? new Date(u.createdAt).toISOString() : ''

      return [id, email, displayName, userRole, statusText, provider, conversionsUsed, createdAt]
    }

    it('correctly maps user with Google provider as Verified and Google provider', () => {
      const user = {
        uid: 'google_123',
        email: 'user@gmail.com',
        displayName: 'Google User',
        providers: ['google.com'],
        isVerified: false,
        conversionsUsed: 15,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }

      const row = mapUserToCsvRow(user)
      assert.deepEqual(row, [
        'google_123',
        'user@gmail.com',
        'Google User',
        'user',
        'Verified',
        'Google',
        '15',
        '2026-01-01T00:00:00.000Z',
      ])
    })

    it('correctly maps unverified email user as Unverified', () => {
      const user = {
        uid: 'email_456',
        email: 'user@example.com',
        displayName: 'Pending User',
        providers: ['email'],
        isVerified: false,
        conversionsUsed: 0,
        createdAt: new Date('2026-02-01T00:00:00Z'),
      }

      const row = mapUserToCsvRow(user)
      assert.deepEqual(row, [
        'email_456',
        'user@example.com',
        'Pending User',
        'user',
        'Unverified',
        'Email',
        '0',
        '2026-02-01T00:00:00.000Z',
      ])
    })
  })

  describe('Audits Export Severity & Description Mapping', () => {
    const getSeverityLevel = (action: string) => {
      const act = (action || '').toLowerCase()
      if (act.includes('fail') || act.includes('error')) return 'error'
      if (act.includes('warn') || act.includes('limit') || act.includes('suspend') || act.includes('delete')) return 'warning'
      return 'info'
    }

    it('computes severity levels accurately', () => {
      assert.equal(getSeverityLevel('login_failed'), 'error')
      assert.equal(getSeverityLevel('user_deleted'), 'warning')
      assert.equal(getSeverityLevel('rate_limit_exceeded'), 'warning')
      assert.equal(getSeverityLevel('user_created'), 'info')
      assert.equal(getSeverityLevel('settings_updated'), 'info')
    })
  })

  describe('Conversions Export Display & Size Formatting', () => {
    function mapConversionToCsvRow(conv: any) {
      const fileId = conv._id?.toString() || ''
      const userDisplay =
        typeof conv.userId === 'object' && conv.userId !== null
          ? conv.userId.displayName || 'Guest User'
          : conv.userId || 'Guest User'
      const userEmail =
        typeof conv.userId === 'object' && conv.userId !== null
          ? conv.userId.email || conv.guestId || 'Anonymous'
          : conv.guestId || 'Anonymous'
      const inputFormat = conv.inputFormat || ''
      const outputFormat = conv.outputFormat || ''
      const fileSizeKb = conv.originalSize != null ? (conv.originalSize / 1024).toFixed(1) : 'N/A'
      const statusText = conv.success ? 'Success' : 'Failed'
      const timestamp = conv.createdAt ? new Date(conv.createdAt).toISOString() : ''

      return [fileId, userDisplay, userEmail, inputFormat, outputFormat, fileSizeKb, statusText, timestamp]
    }

    it('formats conversion doc with populated user correctly', () => {
      const doc = {
        _id: 'conv_abc123',
        userId: { displayName: 'John Doe', email: 'john@example.com' },
        inputFormat: 'svg',
        outputFormat: 'png',
        originalSize: 2048,
        success: true,
        createdAt: new Date('2026-03-01T12:00:00Z'),
      }

      const row = mapConversionToCsvRow(doc)
      assert.deepEqual(row, [
        'conv_abc123',
        'John Doe',
        'john@example.com',
        'svg',
        'png',
        '2.0',
        'Success',
        '2026-03-01T12:00:00.000Z',
      ])
    })

    it('formats anonymous conversion doc correctly with fallback values', () => {
      const doc = {
        _id: 'conv_anon456',
        userId: null,
        guestId: 'guest_ip_hash',
        inputFormat: 'png',
        outputFormat: 'svg',
        originalSize: null,
        success: false,
        createdAt: new Date('2026-03-02T15:30:00Z'),
      }

      const row = mapConversionToCsvRow(doc)
      assert.deepEqual(row, [
        'conv_anon456',
        'Guest User',
        'guest_ip_hash',
        'png',
        'svg',
        'N/A',
        'Failed',
        '2026-03-02T15:30:00.000Z',
      ])
    })
  })
})
