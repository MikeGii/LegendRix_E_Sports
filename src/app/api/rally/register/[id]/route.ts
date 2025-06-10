// Create src/app/api/rally/register/[id]/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sql } from '@vercel/postgres'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError, AuthorizationError, ValidationError, NotFoundError } from '@/lib/errors'
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

// PUT - Update rally registration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_registration_update_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify user token
    const userId = await verifyUserToken(request)
    requestLogger.info('Rally registration update initiated', { userId, registrationId: params.id })
    
    // Parse request body
    const body = await request.json()
    const { additionalNotes, carSetupPreferences } = body
    
    // Check if registration exists and belongs to user
    const registrationResult = await sql`
      SELECT rr.*, r.rally_date, r.registration_ending_date
      FROM rally_registrations rr
      JOIN rallies r ON rr.rally_id = r.rally_id
      WHERE rr.id = ${params.id} AND rr.user_id = ${userId}
    `
    
    if (registrationResult.rows.length === 0) {
      throw new NotFoundError('Rally registration')
    }
    
    const registration = registrationResult.rows[0]
    
    // Check if rally is still upcoming and registration is still open
    const now = new Date()
    const rallyDate = new Date(registration.rally_date)
    
    if (rallyDate <= now) {
      throw new ValidationError('Cannot modify registration for past rallies')
    }
    
    // Update the registration
    const updateResult = await sql`
      UPDATE rally_registrations 
      SET 
        additional_notes = ${additionalNotes || null},
        car_setup_preferences = ${carSetupPreferences || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `
    
    if (updateResult.rows.length === 0) {
      throw new Error('Failed to update registration')
    }
    
    requestLogger.info('Rally registration updated successfully', {
      userId,
      registrationId: params.id
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      updateResult.rows[0],
      'Registration updated successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to update rally registration', errorToLog)
    return NextResponse.json(response, { status })
  }
}

// DELETE - Cancel rally registration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_registration_cancel_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify user token
    const userId = await verifyUserToken(request)
    requestLogger.info('Rally registration cancellation initiated', { userId, registrationId: params.id })
    
    // Parse request body for cancellation reason
    const body = await request.json().catch(() => ({}))
    const { reason } = body
    
    // Check if registration exists and belongs to user
    const registrationResult = await sql`
      SELECT rr.*, r.rally_date, r.registration_ending_date, g.game_name, t.type_name
      FROM rally_registrations rr
      JOIN rallies r ON rr.rally_id = r.rally_id
      JOIN rally_games g ON r.rally_game_id = g.id
      JOIN rally_types t ON r.rally_type_id = t.id
      WHERE rr.id = ${params.id} AND rr.user_id = ${userId} AND rr.status = 'confirmed'
    `
    
    if (registrationResult.rows.length === 0) {
      throw new NotFoundError('Active rally registration')
    }
    
    const registration = registrationResult.rows[0]
    
    // Check if rally is still upcoming
    const now = new Date()
    const rallyDate = new Date(registration.rally_date)
    
    if (rallyDate <= now) {
      throw new ValidationError('Cannot cancel registration for past rallies')
    }
    
    // Cancel the registration (mark as cancelled instead of deleting)
    const cancelResult = await sql`
      UPDATE rally_registrations 
      SET 
        status = 'cancelled',
        cancellation_reason = ${reason || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `
    
    if (cancelResult.rows.length === 0) {
      throw new Error('Failed to cancel registration')
    }
    
    requestLogger.info('Rally registration cancelled successfully', {
      userId,
      registrationId: params.id,
      rallyName: `${registration.game_name} - ${registration.type_name}`,
      reason: reason || 'No reason provided'
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      null,
      'Registration cancelled successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to cancel rally registration', errorToLog)
    return NextResponse.json(response, { status })
  }
}