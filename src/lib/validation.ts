import { z } from 'zod'

export const sessionSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
})

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
})
