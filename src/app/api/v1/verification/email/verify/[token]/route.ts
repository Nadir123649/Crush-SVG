import { NextRequest } from 'next/server'

import { User } from '@/lib/db'
import { hashToken } from '@/lib/passwords'
import { successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const user = await User.findOne({
    emailVerificationToken: hashToken(token),
    emailVerificationTokenExpire: { $gt: Date.now() },
  })
  if (!user) return errorResponse(400, 'token_invalid', 'Invalid or expired verification link')

  await User.updateOne(
    { _id: user._id },
    {
      $set: { isVerified: true },
      $unset: { emailVerificationToken: '', emailVerificationTokenExpire: '' },
    }
  )

  return successResponse({ message: 'Email verified. You can now log in.' })
}
