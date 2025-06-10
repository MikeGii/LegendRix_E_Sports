// src/app/api/test-real-registration/route.ts - Test complete registration flow

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing complete registration flow...')
    
    // Get email from query parameter
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('email')
    
    if (!testEmail) {
      return NextResponse.json({
        success: false,
        error: 'Please provide email parameter: ?email=your@email.com'
      }, { status: 400 })
    }
    
    // Test user data
    const testName = 'Test Registration User'
    const testPassword = 'testpass123'
    
    console.log('👤 Creating test user:', {
      email: testEmail,
      name: testName
    })
    
    // Check if user already exists
    const existingUser = await db.getUserByEmail(testEmail)
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: `User with email ${testEmail} already exists. Use a different email.`
      }, { status: 409 })
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(testPassword, 12)
    
    // Create user (this should generate verification token)
    const user = await db.createUser(testEmail, passwordHash, testName)
    
    console.log('✅ Test user created:', {
      userId: user.id,
      email: user.email,
      hasToken: !!user.email_verification_token,
      tokenLength: user.email_verification_token?.length || 0
    })
    
    // Check if verification token exists
    if (!user.email_verification_token) {
      return NextResponse.json({
        success: false,
        error: 'User created but no verification token generated',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }, { status: 500 })
    }
    
    // Send verification email
    console.log('📧 Sending verification email...')
    const emailResult = await sendVerificationEmail(
      user.email, 
      user.name, 
      user.email_verification_token
    )
    
    // Log email to database
    await db.logEmail(user.id, 'verification', user.email, 'sent')
    
    if (emailResult) {
      console.log('✅ Complete registration test successful')
      
      return NextResponse.json({
        success: true,
        message: `Complete registration test successful! Verification email sent to ${testEmail}`,
        details: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status,
            emailVerified: user.email_verified,
            adminApproved: user.admin_approved
          },
          email: {
            messageId: emailResult.messageId || 'No messageId',
            response: emailResult.response || 'No response',
            accepted: emailResult.accepted || [],
            rejected: emailResult.rejected || []
          },
          verificationUrl: `https://legend-rix-e-sports.vercel.app/api/auth/verify-email?token=${user.email_verification_token}`
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'User created but email sending failed',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Complete registration test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    }, { status: 500 })
  }
}