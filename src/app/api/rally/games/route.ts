// src/app/api/rally/games/route.ts
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

// GET - Fetch all rally games
export async function GET(request: NextRequest) {
  const requestId = `rally_games_get_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    requestLogger.info('Fetching rally games')
    
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'
    
    const games = await rallyDb.getRallyGames(activeOnly)
    
    requestLogger.info('Rally games fetched successfully', { count: games.length })
    
    return NextResponse.json(ApiResponseBuilder.success(games, 'Rally games retrieved successfully'))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to fetch rally games', errorToLog)
    return NextResponse.json(response, { status })
  }
}

// POST - Create a new rally game with types and events
export async function POST(request: NextRequest) {
  const requestId = `rally_games_post_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally game creation initiated', { adminId })
    
    // Parse and validate request body
    const body = await request.json()
    const { gameName, rallyTypes, rallyEvents, gameDescription } = body
    
    // Validation
    if (!gameName || typeof gameName !== 'string' || !gameName.trim()) {
      throw new ValidationError('Game name is required')
    }
    
    if (!Array.isArray(rallyTypes) || rallyTypes.length === 0) {
      throw new ValidationError('At least one rally type is required')
    }
    
    if (!Array.isArray(rallyEvents) || rallyEvents.length === 0) {
      throw new ValidationError('At least one rally event is required')
    }
    
    // Filter out empty strings
    const filteredTypes = rallyTypes.filter(type => typeof type === 'string' && type.trim())
    const filteredEvents = rallyEvents.filter(event => typeof event === 'string' && event.trim())
    
    if (filteredTypes.length === 0) {
      throw new ValidationError('At least one valid rally type is required')
    }
    
    if (filteredEvents.length === 0) {
      throw new ValidationError('At least one valid rally event is required')
    }
    
    requestLogger.info('Creating complete game setup', {
      gameName: gameName.trim(),
      typesCount: filteredTypes.length,
      eventsCount: filteredEvents.length
    })
    
    // Create the complete game setup
    const result = await rallyDb.createCompleteGameSetup(
      gameName.trim(),
      filteredTypes,
      filteredEvents,
      gameDescription?.trim() || undefined
    )
    
    requestLogger.info('Complete game setup created successfully', {
      gameId: result.game.id,
      typesCreated: result.types.length,
      eventsCreated: result.events.length
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      result,
      'Game setup created successfully'
    ), { status: 201 })
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to create rally game setup', errorToLog)
    return NextResponse.json(response, { status })
  }
}