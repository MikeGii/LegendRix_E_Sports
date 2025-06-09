// src/lib/validation.ts (using Zod for better validation)

import { z } from 'zod'

// Common validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim()

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must be less than 50 characters')
  .trim()

export const uuidSchema = z
  .string()
  .uuid('Invalid ID format')

// User-related schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
})

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional()
}).refine(data => data.name || data.email, {
  message: 'At least one field must be provided'
})

// Admin action schemas
export const userActionSchema = z.object({
  userId: uuidSchema,
  action: z.enum(['approve', 'reject', 'deactivate']),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional()
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC')
})

// Validation helper function
export const validateInput = <T>(schema: z.ZodSchema<T>, input: unknown): T => {
  try {
    return schema.parse(input)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new ValidationError(firstError.message, firstError.path.join('.'))
    }
    throw error
  }
}

// Async validation wrapper for API routes
export const withValidation = <T>(
  schema: z.ZodSchema<T>,
  handler: (validatedData: T, ...args: any[]) => Promise<any>
) => {
  return async (input: unknown, ...args: any[]) => {
    const validatedData = validateInput(schema, input)
    return handler(validatedData, ...args)
  }
}