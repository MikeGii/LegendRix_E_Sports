// Create src/app/api/rally/rallies/[id]/route.ts
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

// PUT - Update rally
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_update_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally update initiated', { adminId, rallyId: params.id })
    
    // Parse and validate request body
    const body = await request.json()
    const { rallyDate, registrationEndDate, notes, eventIds } = body
    
    // Check if rally exists
    const existingRally = await sql`
      SELECT * FROM rallies WHERE rally_id = ${params.id}
    `
    
    if (existingRally.rows.length === 0) {
      throw new NotFoundError('Rally')
    }
    
    const rally = existingRally.rows[0]
    
    // Check if rally can be modified (not past and not cancelled)
    const now = new Date()
    const rallyDateTime = new Date(rally.rally_date)
    
    if (rallyDateTime <= now) {
      throw new ValidationError('Cannot modify past rallies')
    }
    
    // Build update query dynamically
    const updateFields = []
    const updateValues = []
    let paramIndex = 1
    
    if (rallyDate) {
      const newRallyDate = new Date(rallyDate)
      if (isNaN(newRallyDate.getTime())) {
        throw new ValidationError('Invalid rally date format')
      }
      if (newRallyDate <= now) {
        throw new ValidationError('Rally date must be in the future')
      }
      updateFields.push(`rally_date = $${paramIndex}`)
      updateValues.push(newRallyDate.toISOString())
      paramIndex++
    }
    
    if (registrationEndDate) {
      const newRegEndDate = new Date(registrationEndDate)
      if (isNaN(newRegEndDate.getTime())) {
        throw new ValidationError('Invalid registration end date format')
      }
      const finalRallyDate = rallyDate ? new Date(rallyDate) : rallyDateTime
      if (newRegEndDate >= finalRallyDate) {
        throw new ValidationError('Registration must end before the rally date')
      }
      updateFields.push(`registration_ending_date = $${paramIndex}`)
      updateValues.push(newRegEndDate.toISOString())
      paramIndex++
    }
    
    if (notes !== undefined) {
      updateFields.push(`optional_notes = $${paramIndex}`)
      updateValues.push(notes || null)
      paramIndex++
    }
    
    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
      updateValues.push(params.id) // Add rally ID for WHERE clause
      
      const updateQuery = `
        UPDATE rallies 
        SET ${updateFields.join(', ')}
        WHERE rally_id = $${paramIndex}
        RETURNING *
      `
      
      const result = await sql.query(updateQuery, updateValues)
      
      if (result.rows.length === 0) {
        throw new Error('Failed to update rally')
      }
    }
    
    // Update event assignments if provided
    if (eventIds && Array.isArray(eventIds)) {
      // Remove existing event assignments
      await sql`DELETE FROM rally_event_assignments WHERE rally_id = ${params.id}`
      
      // Add new event assignments
      for (let i = 0; i < eventIds.length; i++) {
        await sql`
          INSERT INTO rally_event_assignments (rally_id, rally_event_id, event_order)
          VALUES (${params.id}, ${eventIds[i]}, ${i + 1})
        `
      }
    }
    
    requestLogger.info('Rally updated successfully', { rallyId: params.id })
    
    return NextResponse.json(ApiResponseBuilder.success(
      null,
      'Rally updated successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to update rally', errorToLog)
    return NextResponse.json(response, { status })
  }
}

// DELETE - Cancel rally
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_cancel_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally cancellation initiated', { adminId, rallyId: params.id })
    
    const body = await request.json()
    const { reason } = body
    
    // Check if rally exists
    const existingRally = await sql`
      SELECT * FROM rallies WHERE rally_id = ${params.id}
    `
    
    if (existingRally.rows.length === 0) {
      throw new NotFoundError('Rally')
    }
    
    const rally = existingRally.rows[0]
    
    // Check if rally has already happened
    const now = new Date()
    const rallyDateTime = new Date(rally.rally_date)
    
    if (rallyDateTime <= now) {
      throw new ValidationError('Cannot cancel past rallies')
    }
    
    // Mark rally as cancelled instead of deleting
    const result = await sql`
      UPDATE rallies 
      SET status = 'cancelled', 
          cancellation_reason = ${reason || null},
          cancelled_by = ${adminId},
          cancelled_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE rally_id = ${params.id}
      RETURNING *
    `
    
    if (result.rows.length === 0) {
      throw new Error('Failed to cancel rally')
    }
    
    // TODO: Send cancellation emails to registered users
    // const registrations = await sql`SELECT user_id FROM rally_registrations WHERE rally_id = ${params.id} AND status = 'confirmed'`
    
    requestLogger.info('Rally cancelled successfully', {
      rallyId: params.id,
      reason: reason || 'No reason provided'
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      null,
      'Rally cancelled successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to cancel rally', errorToLog)
    return NextResponse.json(response, { status })
  }
}