// src/app/api/test-registration/route.ts - Fixed TypeScript errors

import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing registration email flow...')
    
    // Test data
    const testEmail = 'noreply-ewrc@ideemoto.ee' // Send to yourself for testing
    const testName = 'Test User'
    const testToken = 'test-token-' + Date.now()
    
    console.log('📧 Sending test verification email:', {
      email: testEmail,
      name: testName,
      token: testToken
    })
    
    // Send verification email
    const result = await sendVerificationEmail(testEmail, testName, testToken)
    
    // TypeScript-safe handling of result
    if (result) {
      console.log('✅ Test verification email sent:', {
        messageId: result.messageId || 'No messageId',
        response: result.response || 'No response',
        accepted: result.accepted || [],
        rejected: result.rejected || []
      })
      
      return NextResponse.json({
        success: true,
        message: 'Test verification email sent successfully!',
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
      console.log('⚠️ Email result was undefined')
      return NextResponse.json({
        success: false,
        message: 'Email function returned undefined result',
        details: {
          testData: {
            email: testEmail,
            name: testName,
            token: testToken
          }
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Test registration email failed:', error)
    
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