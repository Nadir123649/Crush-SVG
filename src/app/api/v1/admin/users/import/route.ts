import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-middleware'
import { checkRateLimit, rateLimitHeaders } from '@/lib/security/rate-limit'
import { User, AuditLog, connectToDatabase } from '@/lib/database/db'
import { successResponse, errorResponse, getFrontendOrigin, getApiOrigin } from '@/lib/http/api-response'
import { toUserDTO } from '@/lib/auth/auth'
import { resolveRole } from '@/lib/auth/roles'
import { generateToken, hashToken, VERIFY_TOKEN_MINUTES } from '@/lib/auth/passwords'
import { sendVerificationEmail } from '@/lib/integrations/email'
import { getClientIp } from '@/lib/security/ip'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CsvValidationError {
  row: number
  field: string
  message: string
}

interface ParsedUserRow {
  rowNumber: number
  email: string
  displayName: string
  role: 'user' | 'admin'
}

/**
 * RFC 4180 compliant CSV parser that supports quotes, escaped quotes,
 * CRLF/LF newlines, and strips leading UTF-8 BOM.
 */
function parseCsv(text: string): string[][] {
  let cleanText = text
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1)
  }

  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i]
    const nextChar = cleanText[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"'
          i++ // skip escaped quote
        } else {
          inQuotes = false
        }
      } else {
        currentCell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++
        }
        currentRow.push(currentCell.trim())
        currentCell = ''
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
      } else if (char === '\n') {
        currentRow.push(currentCell.trim())
        currentCell = ''
        if (currentRow.some((c) => c !== '')) {
          rows.push(currentRow)
        }
        currentRow = []
      } else {
        currentCell += char
      }
    }
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow)
    }
  }

  return rows
}

/**
 * Maps headers with case-insensitive aliases for email, displayName, and role.
 */
function resolveHeaderIndices(headers: string[]) {
  let emailIdx = -1
  let displayNameIdx = -1
  let roleIdx = -1

  for (let i = 0; i < headers.length; i++) {
    const raw = headers[i].trim().toLowerCase()
    const clean = raw.replace(/[\s_-]+/g, '')

    if (emailIdx === -1 && (clean === 'email' || raw === 'e-mail' || clean === 'useremail' || clean === 'mail')) {
      emailIdx = i
    } else if (displayNameIdx === -1 && (clean === 'displayname' || clean === 'name' || clean === 'fullname')) {
      displayNameIdx = i
    } else if (roleIdx === -1 && (clean === 'role' || clean === 'userrole')) {
      roleIdx = i
    }
  }

  return { emailIdx, displayNameIdx, roleIdx }
}

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(request, 'admin:users:import', 10, 60_000)
  if (!rl.allowed) {
    return errorResponse(429, 'rate_limit_exceeded', 'Too many requests. Please try again later.', rateLimitHeaders(rl), request)
  }

  const adminCheck = await requireAdmin(request)
  if ('error' in adminCheck) return adminCheck.error
  const who = adminCheck

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse(400, 'invalid_form_data', 'Invalid form data. Please upload a file.', undefined, request)
  }

  const file = formData.get('file')
  if (!file || typeof file === 'string') {
    return errorResponse(400, 'missing_file', 'Please provide a CSV file in the "file" field', undefined, request)
  }

  const fileBlob = file as Blob
  if (fileBlob.size > MAX_FILE_SIZE) {
    return errorResponse(400, 'file_too_large', 'CSV file exceeds the 2 MB size limit', undefined, request)
  }

  const fileText = await fileBlob.text()
  if (!fileText || !fileText.trim()) {
    return errorResponse(400, 'empty_csv', 'The uploaded CSV file is empty', undefined, request)
  }

  const parsedRows = parseCsv(fileText)
  if (parsedRows.length === 0) {
    return errorResponse(400, 'empty_csv', 'The uploaded CSV file contains no readable content', undefined, request)
  }

  const headerRow = parsedRows[0]
  const { emailIdx, displayNameIdx, roleIdx } = resolveHeaderIndices(headerRow)

  if (emailIdx === -1) {
    return errorResponse(
      400,
      'missing_required_column',
      "CSV must contain a required 'Email' column header (aliases: 'email', 'e-mail', 'User Email')",
      undefined,
      request
    )
  }

  const dataRows = parsedRows.slice(1)
  if (dataRows.length === 0) {
    return errorResponse(400, 'no_data_rows', 'CSV file contains headers but no data rows to import', undefined, request)
  }

  await connectToDatabase()

  const validationErrors: CsvValidationError[] = []
  const parsedRecords: ParsedUserRow[] = []
  const seenEmailsInCsv = new Map<string, number>()

  // 1. Validate every row
  dataRows.forEach((row, idx) => {
    const rowNumber = idx + 2 // 1-indexed, accounting for header row
    const rawEmail = row[emailIdx]?.trim() || ''
    const rawDisplayName = displayNameIdx !== -1 ? row[displayNameIdx]?.trim() || '' : ''
    const rawRole = roleIdx !== -1 ? row[roleIdx]?.trim().toLowerCase() || 'user' : 'user'

    // Email validation
    if (!rawEmail) {
      validationErrors.push({
        row: rowNumber,
        field: 'email',
        message: `Row ${rowNumber}: Email address is required`,
      })
      return
    }

    if (!EMAIL_REGEX.test(rawEmail) || rawEmail.length > 254) {
      validationErrors.push({
        row: rowNumber,
        field: 'email',
        message: `Row ${rowNumber}: Invalid email address '${rawEmail}'`,
      })
      return
    }

    const normalizedEmail = rawEmail.toLowerCase()

    // CSV duplicate check
    if (seenEmailsInCsv.has(normalizedEmail)) {
      const priorRow = seenEmailsInCsv.get(normalizedEmail)
      validationErrors.push({
        row: rowNumber,
        field: 'email',
        message: `Row ${rowNumber}: Duplicate email '${rawEmail}' in CSV (already listed on row ${priorRow})`,
      })
      return
    }
    seenEmailsInCsv.set(normalizedEmail, rowNumber)

    // Display Name validation (optional, but 3-16 chars when provided)
    if (rawDisplayName.length > 0) {
      if (rawDisplayName.length < 3 || rawDisplayName.length > 16) {
        validationErrors.push({
          row: rowNumber,
          field: 'displayName',
          message: `Row ${rowNumber}: Display name '${rawDisplayName}' must be between 3 and 16 characters`,
        })
      }
    }

    // Role validation (user or admin)
    if (rawRole !== 'user' && rawRole !== 'admin') {
      validationErrors.push({
        row: rowNumber,
        field: 'role',
        message: `Row ${rowNumber}: Invalid role '${rawRole}'. Allowed values are 'user' or 'admin'`,
      })
    }

    parsedRecords.push({
      rowNumber,
      email: normalizedEmail,
      displayName: rawDisplayName,
      role: rawRole as 'user' | 'admin',
    })
  })

  // 2. Check for existing emails in database
  const emailsToCheck = Array.from(seenEmailsInCsv.keys())
  if (emailsToCheck.length > 0) {
    const existingUsers = await User.find(
      { email: { $in: emailsToCheck } },
      { email: 1 }
    ).lean()

    if (existingUsers.length > 0) {
      const existingEmailSet = new Set(
        existingUsers
          .map((u) => u.email?.toLowerCase().trim())
          .filter(Boolean) as string[]
      )

      for (const record of parsedRecords) {
        if (existingEmailSet.has(record.email)) {
          validationErrors.push({
            row: record.rowNumber,
            field: 'email',
            message: `Row ${record.rowNumber}: A user with email '${record.email}' already exists in the system`,
          })
        }
      }
    }
  }

  // If any errors were detected, return 422 with structured errors
  if (validationErrors.length > 0) {
    validationErrors.sort((a, b) => a.row - b.row)
    const firstError = validationErrors[0].message
    const summaryMessage =
      validationErrors.length === 1
        ? firstError
        : `${validationErrors.length} validation errors found in CSV. ${firstError}`

    return errorResponse(
      422,
      'validation_failed',
      summaryMessage,
      rateLimitHeaders(rl),
      request,
      { errors: validationErrors, totalErrors: validationErrors.length }
    )
  }

  // 3. Create all users securely
  const createdUsers: any[] = []
  const now = Date.now()
  const frontendOrigin = getFrontendOrigin(request)
  const apiOrigin = getApiOrigin(request)

  for (const record of parsedRecords) {
    const token = generateToken()
    const targetEmail = record.email
    const displayName = record.displayName || targetEmail.split('@')[0]

    // Crucial security invariant: unverified accounts cannot have active admin role
    const assignedRole = resolveRole({
      role: record.role,
      isVerified: false,
      providers: ['email'],
    })

    const newUser = await User.create({
      uid: `admin_${targetEmail}`,
      email: targetEmail,
      displayName,
      photoURL: null,
      role: assignedRole,
      isVerified: false,
      emailVerificationToken: hashToken(token),
      emailVerificationTokenExpire: now + VERIFY_TOKEN_MINUTES * 60 * 1000,
      password: undefined, // Never require or store plaintext passwords from CSV
      providers: ['email'],
      linkedProviders: ['email'],
      conversionsUsed: 0,
      lastLoginAt: new Date(now),
    })

    createdUsers.push(newUser)

    // Verification email dispatch
    const verifyUrl = `${apiOrigin}/api/v1/verification/email/verify/${token}`
    try {
      await sendVerificationEmail(targetEmail, verifyUrl, frontendOrigin)
    } catch (err) {
      console.error(`[admin:import] Failed to send verification email to ${targetEmail}:`, err)
    }

    // Audit log per user
    await AuditLog.create({
      adminId: who.user.id,
      action: 'user_created',
      target: newUser._id.toString(),
      resourceType: 'user',
      resourceId: newUser.uid,
      details: { email: newUser.email, role: newUser.role, isVerified: false, imported: true },
      ipAddress: getClientIp(request),
      metadata: { email: newUser.email, role: newUser.role, imported: true },
    })
  }

  // Audit log for the bulk import operation
  await AuditLog.create({
    adminId: who.user.id,
    action: 'users_imported',
    target: 'bulk_import',
    resourceType: 'user',
    resourceId: 'bulk',
    details: {
      count: createdUsers.length,
      emails: createdUsers.map((u) => u.email),
    },
    ipAddress: getClientIp(request),
    metadata: { count: createdUsers.length },
  })

  return successResponse(
    {
      importedCount: createdUsers.length,
      message: `Successfully imported ${createdUsers.length} user${createdUsers.length === 1 ? '' : 's'}. Verification emails have been sent.`,
      users: createdUsers.map(toUserDTO),
    },
    201,
    rateLimitHeaders(rl),
    request
  )
}
