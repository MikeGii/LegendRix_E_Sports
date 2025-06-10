// src/app/api/auth/register/route.ts - Fixed TypeScript errors

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const requestId = `register_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    requestLogger.info('Registration attempt started')
    
    const { email, password, name } = await request.json()

    // Basic validation
    if (!email || !password || !name) {
      requestLogger.warn('Registration failed - missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      requestLogger.warn('Registration failed - password too short')
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      requestLogger.warn('Registration failed - invalid email format')
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    requestLogger.info('Registration validation passed', { email, name })

    // Check if user already exists
    try {
      const existingUser = await db.getUserByEmail(email)
      if (existingUser) {
        requestLogger.warn('Registration failed - user already exists', { email })
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
    } catch (dbError) {
      const errorToLog = dbError instanceof Error ? dbError : new Error('Unknown database error')
      requestLogger.error('Database error during user check', errorToLog)
      return NextResponse.json(
        { error: 'Database error occurred' },
        { status: 500 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    requestLogger.info('Password hashed successfully')

    // Create user
    let user
    try {
      user = await db.createUser(email, passwordHash, name)
      requestLogger.info('User created successfully', { userId: user.id, email: user.email })
      
      // CRITICAL: Log the verification token for debugging
      console.log('🔑 User created with verification token:', {
        userId: user.id,
        email: user.email,
        hasToken: !!user.email_verification_token,
        tokenLength: user.email_verification_token?.length || 0,
        tokenPreview: user.email_verification_token?.substring(0, 8) + '...'
      })
      
    } catch (createError) {
      const errorToLog = createError instanceof Error ? createError : new Error('Unknown user creation error')
      requestLogger.error('Failed to create user', errorToLog)
      
      if (createError instanceof Error && createError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // CRITICAL: Check if verification token exists before sending email
    if (!user.email_verification_token) {
      requestLogger.error('No verification token generated for user')
      console.error('❌ CRITICAL: User created without verification token!', {
        userId: user.id,
        email: user.email,
        userObject: user
      })
      
      return NextResponse.json({
        success: true,
        message: 'Registration successful! However, there was an issue with email verification setup. Please contact support.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          adminApproved: user.admin_approved
        },
        emailSent: false,
        error: 'No verification token generated'
      }, { status: 201 })
    }

    // Send verification email
    console.log('📧 Starting verification email process...', {
      to: user.email,
      name: user.name,
      token: user.email_verification_token.substring(0, 8) + '...'
    })
    
    try {
      console.log('📤 Calling sendVerificationEmail...')
      const emailResult = await sendVerificationEmail(user.email, user.name, user.email_verification_token)
      
      // TypeScript-safe checks for emailResult
      if (emailResult) {
        console.log('✅ Verification email sent successfully:', {
          messageId: emailResult.messageId || 'No messageId',
          response: emailResult.response || 'No response',
          accepted: emailResult.accepted || [],
          rejected: emailResult.rejected || []
        })
      } else {
        console.log('⚠️ Email result was undefined')
      }
      
      await db.logEmail(user.id, 'verification', user.email, 'sent')
      requestLogger.info('Verification email sent successfully', { email: user.email })
      
    } catch (emailError) {
      const errorToLog = emailError instanceof Error ? emailError : new Error('Unknown email error')
      requestLogger.error('Failed to send verification email', errorToLog)
      
      console.error('❌ DETAILED EMAIL ERROR:', {
        error: errorToLog.message,
        stack: errorToLog.stack,
        name: errorToLog.name,
        userEmail: user.email,
        userName: user.name,
        token: user.email_verification_token.substring(0, 8) + '...'
      })
      
      await db.logEmail(user.id, 'verification', user.email, 'failed')
      
      // Don't fail the registration if email fails - user is created
      return NextResponse.json({
        success: true,
        message: 'Registration successful! However, there was an issue sending the verification email. Please contact support.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          emailVerified: user.email_verified,
          adminApproved: user.admin_approved
        },
        emailSent: false,
        emailError: errorToLog.message
      }, { status: 201 })
    }

    requestLogger.info('Registration completed successfully', { userId: user.id })

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        emailVerified: user.email_verified,
        adminApproved: user.admin_approved
      },
      emailSent: true
    }, { status: 201 })

  } catch (error) {
    const errorToLog = error instanceof Error ? error : new Error('Unknown registration error')
    requestLogger.error('Registration failed with unexpected error', errorToLog)
    
    console.error('❌ REGISTRATION PROCESS ERROR:', {
      error: errorToLog.message,
      stack: errorToLog.stack,
      name: errorToLog.name
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error during registration',
        details: process.env.NODE_ENV === 'development' ? errorToLog.message : undefined
      },
      { status: 500 }
    )
  }
}