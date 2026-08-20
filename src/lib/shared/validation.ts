import { z } from 'zod'

export const oauthSchema = z.object({
  firebaseToken: z.string().min(1, 'firebaseToken is required'),
  rememberMe: z.boolean().optional(),
})

export const trackUsageSchema = z.object({
  guestId: z.string().optional(),
  isAuthenticated: z.boolean().optional(),
})

export const svgValidationSchema = z.object({
  svg: z.string().min(1, 'SVG content is required'),
})

export const updateProfileSchema = z.object({
  displayName: z.string().min(3).max(16).optional(),
  name: z.string().min(3).max(16).optional(),
})

export const conversionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', '-createdAt']).default('-createdAt'),
})