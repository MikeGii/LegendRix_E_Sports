// src/app/api/admin/pending-users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

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
  const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, role: string }
  
  if (decoded.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return decoded.userId
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await verifyAdminToken(request)

    // Get all pending users
    const pendingUsers = await db.getPendingUsers()

    // Format the response
    const formattedUsers = pendingUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at.toISOString(),
      emailVerified: user.email_verified,
      adminApproved: user.admin_approved,
      status: user.status
    }))

    return NextResponse.json(formattedUsers)

  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    
    console.error('Get pending users error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}