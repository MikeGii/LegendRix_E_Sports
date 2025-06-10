// src/app/api/admin/pending-users/route.ts - IMPROVED VERSION
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { sql } from '@vercel/postgres'

export const dynamic = 'force-dynamic'

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

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Admin pending users API called')
    
    // Verify admin access
    await verifyAdminToken(request)

    // Get ALL users for admin dashboard (not just pending)
    // This allows proper filtering and stats calculation
    const allUsers = await sql`
      SELECT 
        id,
        email,
        name,
        role,
        status,
        email_verified,
        admin_approved,
        email_verification_token,
        email_verification_expires,
        created_at,
        updated_at
      FROM users 
      WHERE role = 'user'  -- Only show regular users, not admins
      ORDER BY created_at DESC
    `

    console.log(`📊 Retrieved ${allUsers.rows.length} total users`)

    // Format the response with proper camelCase conversion
    const formattedUsers = allUsers.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at.toISOString(),
      emailVerified: user.email_verified,
      adminApproved: user.admin_approved,
      status: user.status,
      role: user.role
    }))

    // Log some stats for debugging
    const stats = {
      total: formattedUsers.length,
      pendingEmail: formattedUsers.filter(u => !u.emailVerified).length,
      pendingApproval: formattedUsers.filter(u => u.emailVerified && !u.adminApproved && u.status !== 'rejected' && u.status !== 'approved').length,
      approved: formattedUsers.filter(u => u.status === 'approved').length,
      rejected: formattedUsers.filter(u => u.status === 'rejected').length
    }

    console.log('📈 User stats:', stats)

    // Set cache headers to prevent stale data
    const response = NextResponse.json(formattedUsers)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error('❌ Admin pending users API error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'No token provided' || error.message === 'Admin access required' || error.message === 'Invalid token') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}