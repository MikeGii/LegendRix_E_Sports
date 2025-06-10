import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

export async function GET(request: NextRequest) {
  // Move request.headers OUTSIDE of try-catch
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'No token provided' },
      { status: 401 }
    )
  }

  const token = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string }
    
    // Get current user data
    const user = await db.getUserById(decoded.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerified: user.email_verified,
        adminApproved: user.admin_approved
      }
    })

  } catch (jwtError) {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401 }
    )
  }
}