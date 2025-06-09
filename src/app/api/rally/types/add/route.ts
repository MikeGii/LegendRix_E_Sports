// src/app/api/rally/types/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { rallyDb } from '@/lib/rally-db'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError, AuthorizationError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthorizationError('No token provided')
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; role: string }
    
    if (decoded.role !== 'admin') {
      throw new AuthorizationError('Admin access required')
    }

    return decoded.userId
  } catch (error) {
    throw new AuthorizationError('Invalid token')
  }
}

// POST - Add new rally types to an existing game
export async function POST(request: NextRequest) {
  const requestId = `rally_types_add_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Add rally types initiated', { adminId })
    
    // Parse and validate request body
    const body = await request.json()
    const { gameId, rallyTypes } = body
    
    // Validation
    if (!gameId || typeof gameId !== 'string') {
      throw new ValidationError('Game ID is required')
    }
    
    if (!Array.isArray(rallyTypes) || rallyTypes.length === 0) {
      throw new ValidationError('At least one rally type is required')
    }
    
    // Filter out empty strings
    const filteredTypes = rallyTypes.filter(type => typeof type === 'string' && type.trim())
    
    if (filteredTypes.length === 0) {
      throw new ValidationError('At least one valid rally type is required')
    }
    
    requestLogger.info('Adding rally types to existing game', {
      gameId,
      typesCount: filteredTypes.length
    })
    
    // Add the rally types
    const newTypes = await rallyDb.createRallyTypes(gameId, filteredTypes)
    
    requestLogger.info('Rally types added successfully', {
      gameId,
      typesAdded: newTypes.length
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      newTypes,
      `${newTypes.length} rally type(s) added successfully`
    ), { status: 201 })
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to add rally types', errorToLog)
    return NextResponse.json(response, { status })
  }
}