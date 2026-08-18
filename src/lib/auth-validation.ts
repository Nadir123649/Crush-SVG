import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(3, 'Name must be between 3 and 16 characters').max(16, 'Name must be between 3 and 16 characters'),
  email: z.string().trim().email(),
  password: z.string().min(8).max(20),
})

export const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional(),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(20),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(20),
})
