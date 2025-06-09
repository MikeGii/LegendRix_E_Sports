// src/lib/api-response.ts

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

/**
 * Create a successful API response
 */
export const createSuccessResponse = <T>(
  data?: T,
  message?: string,
  pagination?: PaginatedResponse<T>['pagination']
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    ...(pagination && { pagination })
  }
  return response
}

/**
 * Create a paginated success response
 */
export const createPaginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit)
  
  return {
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  }
}

/**
 * Create an error API response
 */
export const createErrorResponse = (
  error: string,
  code?: string
): ApiResponse => ({
  success: false,
  error,
  ...(code && { code })
})

/**
 * Standardized response wrapper for API routes
 */
export class ApiResponseBuilder {
  static success<T>(data?: T, message?: string): ApiResponse<T> {
    return createSuccessResponse(data, message)
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): PaginatedResponse<T> {
    return createPaginatedResponse(data, page, limit, total, message)
  }

  static error(error: string, code?: string): ApiResponse {
    return createErrorResponse(error, code)
  }

  static validation(field: string, message: string): ApiResponse {
    return createErrorResponse(message, `VALIDATION_${field.toUpperCase()}`)
  }

  static notFound(resource: string = 'Resource'): ApiResponse {
    return createErrorResponse(`${resource} not found`, 'NOT_FOUND')
  }

  static unauthorized(message: string = 'Authentication required'): ApiResponse {
    return createErrorResponse(message, 'UNAUTHORIZED')
  }

  static forbidden(message: string = 'Access denied'): ApiResponse {
    return createErrorResponse(message, 'FORBIDDEN')
  }

  static conflict(message: string = 'Resource already exists'): ApiResponse {
    return createErrorResponse(message, 'CONFLICT')
  }

  static serverError(message: string = 'Internal server error'): ApiResponse {
    return createErrorResponse(message, 'INTERNAL_ERROR')
  }

  static serviceUnavailable(service: string = 'Service'): ApiResponse {
    return createErrorResponse(`${service} temporarily unavailable`, 'SERVICE_UNAVAILABLE')
  }
}