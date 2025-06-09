// src/app/api/rally/rallies/route.ts
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

// GET - Fetch rallies with details
export async function GET(request: NextRequest) {
  const requestId = `rallies_get_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    requestLogger.info('Fetching rallies')
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const upcomingOnly = searchParams.get('upcoming') === 'true'
    
    const rallies = await rallyDb.getRalliesWithDetails(limit, offset, upcomingOnly)
    
    requestLogger.info('Rallies fetched successfully', { count: rallies.length })
    
    return NextResponse.json(ApiResponseBuilder.success(rallies, 'Rallies retrieved successfully'))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to fetch rallies', errorToLog)
    return NextResponse.json(response, { status })
  }
}

// POST - Create a new rally
export async function POST(request: NextRequest) {
  const requestId = `rallies_post_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally creation initiated', { adminId })
    
    // Parse and validate request body
    const body = await request.json()
    const { gameId, typeId, eventIds, rallyDate, registrationEndDate, notes } = body
    
    // Validation
    if (!gameId || typeof gameId !== 'string') {
      throw new ValidationError('Game ID is required')
    }
    
    if (!typeId || typeof typeId !== 'string') {
      throw new ValidationError('Rally type ID is required')
    }
    
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      throw new ValidationError('At least one rally event is required')
    }
    
    // Validate all event IDs are strings
    if (!eventIds.every(id => typeof id === 'string' && id.trim())) {
      throw new ValidationError('All event IDs must be valid')
    }
    
    if (!rallyDate || typeof rallyDate !== 'string') {
      throw new ValidationError('Rally date is required')
    }
    
    if (!registrationEndDate || typeof registrationEndDate !== 'string') {
      throw new ValidationError('Registration end date is required')
    }
    
    // Parse dates
    const rallyDateTime = new Date(rallyDate)
    const registrationEndDateTime = new Date(registrationEndDate)
    
    // Validate dates
    if (isNaN(rallyDateTime.getTime())) {
      throw new ValidationError('Invalid rally date format')
    }
    
    if (isNaN(registrationEndDateTime.getTime())) {
      throw new ValidationError('Invalid registration end date format')
    }
    
    if (registrationEndDateTime >= rallyDateTime) {
      throw new ValidationError('Registration must end before the rally date')
    }
    
    if (rallyDateTime <= new Date()) {
      throw new ValidationError('Rally date must be in the future')
    }
    
    requestLogger.info('Creating rally', {
      gameId,
      typeId,
      eventIds,
      eventCount: eventIds.length,
      rallyDate: rallyDateTime.toISOString(),
      registrationEndDate: registrationEndDateTime.toISOString()
    })
    
    // Create the rally with multiple events
    const rally = await rallyDb.createRally(
      gameId,
      typeId,
      eventIds, // Now an array
      rallyDateTime,
      registrationEndDateTime,
      adminId,
      notes?.trim() || undefined
    )
    
    requestLogger.info('Rally created successfully', { rallyId: rally.rally_id })
    
    // Get the rally with details for response
    const rallyWithDetails = await rallyDb.getRallyById(rally.rally_id)
    
    return NextResponse.json(ApiResponseBuilder.success(
      rallyWithDetails,
      'Rally created successfully'
    ), { status: 201 })
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to create rally', errorToLog)
    return NextResponse.json(response, { status })
  }
}