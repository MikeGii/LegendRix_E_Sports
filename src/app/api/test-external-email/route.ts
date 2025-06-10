// src/app/api/test-external-email/route.ts - Test to external email

import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email to external address...')
    
    // Get email from query parameter
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('email')
    
    if (!testEmail) {
      return NextResponse.json({
        success: false,
        error: 'Please provide email parameter: ?email=your@email.com'
      }, { status: 400 })
    }
    
    // Test data
    const testName = 'External Test User'
    const testToken = 'external-test-token-' + Date.now()
    
    console.log('📧 Sending test verification email to external address:', {
      email: testEmail,
      name: testName,
      token: testToken
    })
    
    // Send verification email
    const result = await sendVerificationEmail(testEmail, testName, testToken)
    
    if (result) {
      console.log('✅ External test verification email sent:', {
        messageId: result.messageId || 'No messageId',
        response: result.response || 'No response',
        accepted: result.accepted || [],
        rejected: result.rejected || []
      })
      
      return NextResponse.json({
        success: true,
        message: `Test verification email sent to ${testEmail} successfully!`,
        details: {
          messageId: result.messageId || 'No messageId',
          response: result.response || 'No response',
          accepted: result.accepted || [],
          rejected: result.rejected || [],
          testData: {
            email: testEmail,
            name: testName,
            token: testToken
          }
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Email function returned undefined result'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ External test email failed:', error)
    
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