// src/app/api/rally/types/[id]/route.ts
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

// PUT - Update rally type
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_type_update_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally type update initiated', { adminId, typeId: params.id })
    
    // Parse and validate request body
    const body = await request.json()
    const { typeName } = body
    
    if (!typeName || typeof typeName !== 'string' || !typeName.trim()) {
      throw new ValidationError('Type name is required')
    }
    
    // Check if rally type exists
    const existingType = await sql`
      SELECT * FROM rally_types WHERE id = ${params.id}
    `
    
    if (existingType.rows.length === 0) {
      throw new NotFoundError('Rally type')
    }
    
    // Update the rally type
    const result = await sql`
      UPDATE rally_types 
      SET type_name = ${typeName.trim()}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `
    
    if (result.rows.length === 0) {
      throw new Error('Failed to update rally type')
    }
    
    requestLogger.info('Rally type updated successfully', {
      typeId: params.id,
      newName: typeName.trim()
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      result.rows[0],
      'Rally type updated successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to update rally type', errorToLog)
    return NextResponse.json(response, { status })
  }
}

// DELETE - Delete rally type
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = `rally_type_delete_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Rally type deletion initiated', { adminId, typeId: params.id })
    
    // Check if rally type exists
    const existingType = await sql`
      SELECT * FROM rally_types WHERE id = ${params.id}
    `
    
    if (existingType.rows.length === 0) {
      throw new NotFoundError('Rally type')
    }
    
    // Check if rally type is being used in any rallies
    const usageCheck = await sql`
      SELECT COUNT(*) as count FROM rallies WHERE rally_type_id = ${params.id}
    `
    
    const usageCount = parseInt(usageCheck.rows[0]?.count || '0')
    
    if (usageCount > 0) {
      throw new ValidationError(`Cannot delete rally type as it is used in ${usageCount} rally(s)`)
    }
    
    // Delete the rally type
    const result = await sql`
      DELETE FROM rally_types WHERE id = ${params.id}
      RETURNING *
    `
    
    if (result.rows.length === 0) {
      throw new Error('Failed to delete rally type')
    }
    
    requestLogger.info('Rally type deleted successfully', {
      typeId: params.id,
      typeName: result.rows[0].type_name
    })
    
    return NextResponse.json(ApiResponseBuilder.success(
      null,
      'Rally type deleted successfully'
    ))
    
  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Failed to delete rally type', errorToLog)
    return NextResponse.json(response, { status })
  }
}