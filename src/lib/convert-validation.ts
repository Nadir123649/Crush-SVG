import { z } from 'zod'

export const convertSchema = z.object({
  svg: z.string().min(1, 'SVG content is required'),
  format: z.enum(['png', 'jpeg', 'webp']).default('png'),
  width: z.number().int().min(1).max(8192).optional(),
  scale: z.number().min(0.1).max(10).default(2),
  transparent: z.boolean().default(true),
  quality: z.number().int().min(1).max(100).default(90),
})

export type ConvertInput = z.infer<typeof convertSchema>