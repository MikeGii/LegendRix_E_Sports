// src/app/api/rally/events/[id]/route.ts
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

// PUT - Update rally event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_event_update_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally event update initiated', { adminId, eventId: params.id })
    
    // Parse and validate request body
    const body = await request.json()
    const { eventName } = body
    
    if (!eventName || typeof eventName !== 'string' || !eventName.trim()) {
      throw new ValidationError('Event name is required')
    }
    
    // Check if rally event exists
    const existingEvent = await sql`
      SELECT * FROM rally_events WHERE id = ${params.id}
    `
    
    if (existingEvent.rows.length === 0) {
      throw new NotFoundError('Rally event')
    }
    
    // Update the rally event
    const result = await sql`
      UPDATE rally_events 
      SET event_name = ${eventName.trim()}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `
    
    if (result.rows.length === 0) {
      throw new Error('Failed to update rally event')
    }
    
    requestLogger.info('Rally event updated successfully', {
      eventId: params.id,
      newName: eventName.trim()
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      result.rows[0],
      'Rally event updated successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to update rally event', errorToLog)
    return NextResponse.json(response, { status })
  }
}

// DELETE - Delete rally event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_event_delete_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally event deletion initiated', { adminId, eventId: params.id })
    
    // Check if rally event exists
    const existingEvent = await sql`
      SELECT * FROM rally_events WHERE id = ${params.id}
    `
    
    if (existingEvent.rows.length === 0) {
      throw new NotFoundError('Rally event')
    }
    
    // Check if rally event is being used in any rally assignments
    const usageCheck = await sql`
      SELECT COUNT(*) as count FROM rally_event_assignments WHERE rally_event_id = ${params.id}
    `
    
    const usageCount = parseInt(usageCheck.rows[0]?.count || '0')
    
    if (usageCount > 0) {
      throw new ValidationError(`Cannot delete rally event as it is used in ${usageCount} rally assignment(s)`)
    }
    
    // Delete the rally event
    const result = await sql`
      DELETE FROM rally_events WHERE id = ${params.id}
      RETURNING *
    `
    
    if (result.rows.length === 0) {
      throw new Error('Failed to delete rally event')
    }
    
    requestLogger.info('Rally event deleted successfully', {
      eventId: params.id,
      eventName: result.rows[0].event_name
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      null,
      'Rally event deleted successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to delete rally event', errorToLog)
    return NextResponse.json(response, { status })
  }
}