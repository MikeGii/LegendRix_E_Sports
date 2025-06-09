import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError, AuthorizationError, NotFoundError, ValidationError, DatabaseError } from '@/lib/errors'
import { validateInput, userActionSchema } from '@/lib/validation'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string; role: string }
    
    if (decoded.role !== 'admin') {
      throw new Error('Admin access required')
    }

    return decoded.userId
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export async function POST(request: NextRequest) {
  const requestId = `admin_action_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)
    requestLogger.info('Admin action initiated', { adminId })
    
    // Validate input
    const body = await request.json()
    const { userId, action, reason } = validateInput(userActionSchema, body)
    
    // Get the target user first to ensure they exist
    const targetUser = await db.getUserById(userId)
    if (!targetUser) {
      throw new NotFoundError('User')
    }

    // Perform the action with transaction-like behavior
    let success = false
    switch (action) {
      case 'approve':
        success = await db.approveUser(userId, adminId, reason)
        break
      case 'reject':
        success = await db.rejectUser(userId, adminId, reason)
        break
      case 'deactivate':
        success = await db.deactivateUser(userId, adminId, reason)
        break
      default:
        throw new ValidationError('Invalid action')
    }

    if (!success) {
      throw new DatabaseError('Failed to update user status')
    }

    requestLogger.info('Admin action completed', {
      adminId,
      targetUserId: userId,
      action,
      hasReason: !!reason
    })

    // Send notification email
    try {
      if (action === 'approve') {
        await sendApprovalEmail(targetUser.email, targetUser.name)
        await db.logEmail(userId, 'approval', targetUser.email, 'sent')
      } else if (action === 'reject') {
        await sendRejectionEmail(targetUser.email, targetUser.name, reason)
        await db.logEmail(userId, 'rejection', targetUser.email, 'sent')
      }
    } catch (emailError) {
      const errorToLog = emailError instanceof Error ? emailError : new Error('Unknown email error')
      requestLogger.error('Failed to send notification email', errorToLog)
      await db.logEmail(userId, action === 'approve' ? 'approval' : 'rejection', targetUser.email, 'failed')
    }

    return NextResponse.json(ApiResponseBuilder.success(
      { userId, action, status: 'completed' },
      `User ${action}${action.endsWith('e') ? 'd' : 'ed'} successfully`
    ))

  } catch (error) {
    const { response, status } = handleApiError(error)
    const errorToLog = error instanceof Error ? error : new Error('Unknown error')
    requestLogger.error('Admin action failed', errorToLog)
    return NextResponse.json(response, { status })
  }
}