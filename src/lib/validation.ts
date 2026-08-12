import { z } from 'zod'

export const oauthSchema = z.object({
  firebaseToken: z.string().min(1, 'firebaseToken is required'),
  rememberMe: z.boolean().optional(),
})
