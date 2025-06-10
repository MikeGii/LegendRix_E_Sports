// src/app/api/rally/types/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { rallyDb } from '@/lib/rally-db'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError, ValidationError } from '@/lib/errors'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET - Fetch rally types for a specific game
export async function GET(request: NextRequest) {
  const requestId = `rally_types_get_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  // Move request.url OUTSIDE of try-catch
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const activeOnly = searchParams.get('active') !== 'false'
  
  try {
    if (!gameId) {
      throw new ValidationError('Game ID is required')
    }
    
    requestLogger.info('Fetching rally types', { gameId, activeOnly })
    
    const types = await rallyDb.getRallyTypesByGame(gameId, activeOnly)
    
    requestLogger.info('Rally types fetched successfully', { gameId, count: types.length })
    
    return NextResponse.json(ApiResponseBuilder.success(types, 'Rally types retrieved successfully'))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to fetch rally types', errorToLog)
    return NextResponse.json(response, { status })
  }
}