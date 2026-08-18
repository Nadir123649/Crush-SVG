import { z } from 'zod'

export const convertSchema = z.object({
  svg: z.string().min(1, 'SVG content is required').max(5 * 1024 * 1024, 'SVG content too large. Maximum size is 5MB.'),
  format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  width: z.number().int().min(1).max(8192).optional(),
  height: z.number().int().min(1).max(8192).optional(),
  scale: z
    .number()
    .min(0.1, 'Scale must be between 0.1x and 16x')
    .max(16, 'Scale must be between 0.1x and 16x')
    .default(2),
  transparent: z.boolean().default(true),
  quality: z.number().int().min(1).max(100).default(90),
})

export type ConvertInput = z.infer<typeof convertSchema>