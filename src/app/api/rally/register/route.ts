// Create src/app/api/rally/register/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sql } from '@vercel/postgres'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError, AuthorizationError, ValidationError, ConflictError } from '@/lib/errors'
import { logger } from '@/lib/logger'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

async function verifyUserToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthorizationError('No token provided')
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; role: string }
    return decoded.userId
  } catch (error) {
    throw new AuthorizationError('Invalid token')
  }
}

// POST - Register user for a rally
export async function POST(request: NextRequest) {
  const requestId = `rally_register_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify user token
    const userId = await verifyUserToken(request)
    requestLogger.info('Rally registration initiated', { userId })
    
    // Parse and validate request body
    const body = await request.json()
    const { rallyId, additionalNotes, carSetupPreferences } = body
    
    if (!rallyId || typeof rallyId !== 'string') {
      throw new ValidationError('Rally ID is required')
    }
    
    // Check if rally exists and is available for registration
    const rallyResult = await sql`
      SELECT 
        r.*,
        g.game_name,
        t.type_name
      FROM rallies r
      JOIN rally_games g ON r.rally_game_id = g.id
      JOIN rally_types t ON r.rally_type_id = t.id
      WHERE r.rally_id = ${rallyId}
        AND r.status = 'active'
        AND r.registration_ending_date > NOW()
        AND r.rally_date > NOW()
    `
    
    if (rallyResult.rows.length === 0) {
      throw new ValidationError('Rally not found, registration closed, or rally has already occurred')
    }
    
    const rally = rallyResult.rows[0]
    
    // Check if user is already registered for this rally
    const existingRegistration = await sql`
      SELECT id FROM rally_registrations 
      WHERE rally_id = ${rallyId} AND user_id = ${userId}
    `
    
    if (existingRegistration.rows.length > 0) {
      throw new ConflictError('You are already registered for this rally')
    }
    
    // Get user details for logging
    const userResult = await sql`
      SELECT name, email FROM users WHERE id = ${userId}
    `
    
    if (userResult.rows.length === 0) {
      throw new AuthorizationError('User not found')
    }
    
    const user = userResult.rows[0]
    
    // Create the registration
    const registrationResult = await sql`
      INSERT INTO rally_registrations (
        rally_id, 
        user_id, 
        additional_notes, 
        car_setup_preferences,
        status
      )
      VALUES (
        ${rallyId}, 
        ${userId}, 
        ${additionalNotes || null}, 
        ${carSetupPreferences || null},
        'confirmed'
      )
      RETURNING *
    `
    
    if (registrationResult.rows.length === 0) {
      throw new Error('Failed to create registration')
    }
    
    const registration = registrationResult.rows[0]
    
    requestLogger.info('Rally registration successful', {
      userId,
      rallyId,
      userName: user.name,
      rallyName: `${rally.game_name} - ${rally.type_name}`
    })
    
    // TODO: Send confirmation email to user
    // await sendRallyRegistrationConfirmation(user.email, user.name, rally)
    
    return NextResponse.json(ApiResponseBuilder.success(
      {
        registrationId: registration.id,
        rallyId: rallyId,
        rallyName: `${rally.game_name} - ${rally.type_name}`,
        rallyDate: rally.rally_date,
        registrationDate: registration.registration_date
      },
      'Successfully registered for rally!'
    ), { status: 201 })
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Rally registration failed', errorToLog)
    return NextResponse.json(response, { status })
  }
}

// GET - Get user's rally registrations
export async function GET(request: NextRequest) {
  const requestId = `rally_registrations_get_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify user token
    const userId = await verifyUserToken(request)
    requestLogger.info('Fetching user rally registrations', { userId })
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'upcoming', 'past', 'cancelled'
    
    let whereClause = 'WHERE rr.user_id = $1'
    let queryParams = [userId]
    let paramIndex = 2
    
    if (status === 'upcoming') {
      whereClause += ` AND r.rally_date > NOW() AND r.status = 'active'`
    } else if (status === 'past') {
      whereClause += ` AND r.rally_date <= NOW()`
    } else if (status === 'cancelled') {
      whereClause += ` AND (rr.status = 'cancelled' OR r.status = 'cancelled')`
    }
    
    const registrationsResult = await sql.query(`
      SELECT 
        rr.*,
        r.rally_date,
        r.registration_ending_date,
        r.optional_notes as rally_notes,
        r.status as rally_status,
        g.game_name,
        t.type_name,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'event_id', re.id,
            'event_name', re.event_name,
            'event_order', rea.event_order,
            'country', re.country,
            'surface_type', re.surface_type
          ) ORDER BY rea.event_order
        ) as events
      FROM rally_registrations rr
      JOIN rallies r ON rr.rally_id = r.rally_id
      JOIN rally_games g ON r.rally_game_id = g.id
      JOIN rally_types t ON r.rally_type_id = t.id
      LEFT JOIN rally_event_assignments rea ON r.rally_id = rea.rally_id
      LEFT JOIN rally_events re ON rea.rally_event_id = re.id
      ${whereClause}
      GROUP BY rr.id, r.rally_id, r.rally_date, r.registration_ending_date, 
               r.optional_notes, r.status, g.game_name, t.type_name
      ORDER BY r.rally_date DESC
    `, queryParams)
    
    requestLogger.info('User rally registrations fetched', { 
      userId, 
      count: registrationsResult.rows.length 
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      registrationsResult.rows,
      'Rally registrations retrieved successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to fetch rally registrations', errorToLog)
    return NextResponse.json(response, { status })
  }
}