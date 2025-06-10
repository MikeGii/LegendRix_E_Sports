// src/app/api/rally/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rallyDb } from '@/lib/rally-db'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET - Fetch rally events for a specific game
export async function GET(request: NextRequest) {
  const requestId = `rally_events_get_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  // Move request.url OUTSIDE of try-catch
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const activeOnly = searchParams.get('active') !== 'false'
  
  try {
    if (!gameId) {
      throw new ValidationError('Game ID is required')
    }
    
    requestLogger.info('Fetching rally events', { gameId, activeOnly })
    
    const events = await rallyDb.getRallyEventsByGame(gameId, activeOnly)
    
    requestLogger.info('Rally events fetched successfully', { gameId, count: events.length })
    
    return NextResponse.json(ApiResponseBuilder.success(events, 'Rally events retrieved successfully'))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to fetch rally events', errorToLog)
    return NextResponse.json(response, { status })
  }
}