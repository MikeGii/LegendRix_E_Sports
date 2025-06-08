// src/app/api/admin/user-action/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

async function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.substring(7)
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string }
  
  if (decoded.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return decoded.userId
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminId = await verifyAdminToken(request)

    const { userId, action, reason } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get the target user
    const user = await db.getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Perform the action
    let success = false
    if (action === 'approve') {
      success = await db.approveUser(userId)
    } else if (action === 'reject') {
      success = await db.rejectUser(userId)
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update user status' },
        { status: 500 }
      )
    }

    // Log the admin action
    await db.logAdminAction(adminId, userId, action, reason)

    // Send notification email
    try {
      if (action === 'approve') {
        await sendApprovalEmail(user.email, user.name)
        await db.logEmail(userId, 'approval', user.email, 'sent')
      } else {
        await sendRejectionEmail(user.email, user.name, reason)
        await db.logEmail(userId, 'rejection', user.email, 'sent')
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      await db.logEmail(userId, action === 'approve' ? 'approval' : 'rejection', user.email, 'failed')
    }

    return NextResponse.json({
      success: true,
      message: `User ${action}${action === 'approve' ? 'd' : 'ed'} successfully`
    })

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    
    console.error('User action error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}