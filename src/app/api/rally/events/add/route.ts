// src/app/api/rally/events/add/route.ts
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

// POST - Add new rally events to an existing game
export async function POST(request: NextRequest) {
  const requestId = `rally_events_add_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Add rally events initiated', { adminId })
    
    // Parse and validate request body
    const body = await request.json()
    const { gameId, rallyEvents } = body
    
    // Validation
    if (!gameId || typeof gameId !== 'string') {
      throw new ValidationError('Game ID is required')
    }
    
    if (!Array.isArray(rallyEvents) || rallyEvents.length === 0) {
      throw new ValidationError('At least one rally event is required')
    }
    
    // Filter out empty strings
    const filteredEvents = rallyEvents.filter(event => typeof event === 'string' && event.trim())
    
    if (filteredEvents.length === 0) {
      throw new ValidationError('At least one valid rally event is required')
    }
    
    requestLogger.info('Adding rally events to existing game', {
      gameId,
      eventsCount: filteredEvents.length
    })
    
    // Add the rally events
    const newEvents = await rallyDb.createRallyEvents(gameId, filteredEvents)
    
    requestLogger.info('Rally events added successfully', {
      gameId,
      eventsAdded: newEvents.length
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      newEvents,
      `${newEvents.length} rally event(s) added successfully`
    ), { status: 201 })
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to add rally events', errorToLog)
    return NextResponse.json(response, { status })
  }
}