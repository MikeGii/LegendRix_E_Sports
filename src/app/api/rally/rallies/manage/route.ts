export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sql } from '@vercel/postgres'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError, AuthorizationError } from '@/lib/errors'
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

// GET - Fetch all rallies for management with filters
export async function GET(request: NextRequest) {
  const requestId = `rallies_manage_get_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('gameId')
  const status = searchParams.get('status') as 'upcoming' | 'active' | 'past' | 'cancelled' | null
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Fetching rallies for management', { adminId, gameId, status, limit, offset })
    
    // Build where conditions based on status
    let whereConditions = []
    let statusCondition = ''
    
    switch (status) {
      case 'upcoming':
        statusCondition = 'AND r.rally_date > NOW() AND r.registration_ending_date > NOW() AND (r.status IS NULL OR r.status = \'active\')'
        break
      case 'active':
        statusCondition = 'AND r.rally_date > NOW() AND r.registration_ending_date <= NOW() AND (r.status IS NULL OR r.status = \'active\')'
        break
      case 'past':
        statusCondition = 'AND r.rally_date <= NOW()'
        break
      case 'cancelled':
        statusCondition = 'AND r.status = \'cancelled\''
        break
      default:
        statusCondition = '' // Show all
    }
    
    if (gameId) {
      whereConditions.push(`r.rally_game_id = '${gameId}'`)
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')} ${statusCondition}`
      : statusCondition ? `WHERE ${statusCondition.substring(4)}` : '' // Remove 'AND' if no other conditions
    
    // Get rallies with enhanced details - using direct SQL
    const ralliesQuery = `
      SELECT 
        r.*,
        g.game_name,
        t.type_name,
        u.name as creator_name,
        COALESCE(reg_counts.registration_count, 0) as registration_count,
        CASE 
          WHEN r.rally_date <= NOW() THEN 'past'
          WHEN r.registration_ending_date <= NOW() AND r.rally_date > NOW() THEN 'active'
          WHEN r.registration_ending_date > NOW() THEN 'upcoming'
          ELSE 'unknown'
        END as computed_status
      FROM rallies r
      JOIN rally_games g ON r.rally_game_id = g.id
      JOIN rally_types t ON r.rally_type_id = t.id
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN (
        SELECT rally_id, COUNT(*) as registration_count 
        FROM rally_registrations 
        WHERE status = 'confirmed'
        GROUP BY rally_id
      ) reg_counts ON r.rally_id = reg_counts.rally_id
      ${whereClause}
      ORDER BY r.rally_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    
    const ralliesResult = await sql.query(ralliesQuery)
    const rallies = ralliesResult.rows
    
    // Get events for each rally
    const ralliesWithDetails = []
    
    for (const rally of rallies) {
      const eventsResult = await sql`
        SELECT 
          rea.event_order,
          re.id as event_id,
          re.event_name,
          re.country,
          re.surface_type
        FROM rally_event_assignments rea
        JOIN rally_events re ON rea.rally_event_id = re.id
        WHERE rea.rally_id = ${rally.rally_id}
        ORDER BY rea.event_order ASC
      `
      
      const events = eventsResult.rows.map((row: any) => ({
        event_id: row.event_id,
        event_name: row.event_name,
        event_order: row.event_order,
        country: row.country,
        surface_type: row.surface_type
      }))
      
      ralliesWithDetails.push({
        ...rally,
        events
      })
    }
    
    requestLogger.info('Rallies for management fetched successfully', { count: ralliesWithDetails.length })
    
    return NextResponse.json(ApiResponseBuilder.success(ralliesWithDetails, 'Rallies retrieved successfully'))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to fetch rallies for management', errorToLog)
    return NextResponse.json(response, { status })
  }
}