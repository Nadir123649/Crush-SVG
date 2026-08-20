import 'server-only'

import { z } from 'zod'

const requiredSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
})

export type ValidatedEnv = z.infer<typeof requiredSchema>

export function validateEnv(env: NodeJS.ProcessEnv = process.env): ValidatedEnv {
  const result = requiredSchema.safeParse(env)
  if (!result.success) {
    if (process.env.VERCEL === '1' && process.env.CI === '1') {
      console.warn('Skipping strict env validation during Vercel build phase')
      return {} as ValidatedEnv
    }
    const issues = result.error.issues.map((i) => i.path.join('.') || '(root)')
    throw new Error(`Invalid environment configuration. Fix: ${issues.join(', ')}`)
  }
  return result.data
}

/**
 * Validates a group of optional, feature-specific variables. Used at the point
 * a feature is actually exercised, so the app can boot without every provider
 * configured. Returns false (and logs the missing names) when not configured.
 */
export function requireOptionalEnv(names: string[], env: NodeJS.ProcessEnv = process.env): boolean {
  const missing = names.filter((name) => !env[name])
  if (missing.length > 0) {
    console.warn(`[crushsvg] Optional config missing (${missing.join(', ')}) — feature disabled.`)
    return false
  }
  return true
}