// src/lib/errors.ts
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code?: string
  public readonly isOperational: boolean

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message)
    
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational

    // Maintain proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError)
  }
}

// Predefined error types for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, field ? `VALIDATION_${field.toUpperCase()}` : 'VALIDATION_ERROR')
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT')
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR')
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message?: string) {
    super(message || `${service} service unavailable`, 503, 'EXTERNAL_SERVICE_ERROR')
  }
}

// Error handler for API routes
export interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

export const handleApiError = (error: unknown): { response: ErrorResponse; status: number } => {
  if (error instanceof AppError) {
    return {
      response: {
        success: false,
        error: error.message,
        code: error.code,
      },
      status: error.statusCode
    }
  }

  // Handle specific database errors
  if (error instanceof Error) {
    if (error.message.includes('unique constraint')) {
      return {
        response: {
          success: false,
          error: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE'
        },
        status: 409
      }
    }

    if (error.message.includes('foreign key constraint')) {
      return {
        response: {
          success: false,
          error: 'Referenced resource not found',
          code: 'REFERENCE_NOT_FOUND'
        },
        status: 404
      }
    }

    if (error.message.includes('connection') || error.message.includes('timeout')) {
      return {
        response: {
          success: false,
          error: 'Database temporarily unavailable',
          code: 'DATABASE_UNAVAILABLE'
        },
        status: 503
      }
    }
  }

  // Generic server error
  console.error('Unhandled error:', error)
  return {
    response: {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    },
    status: 500
  }
}