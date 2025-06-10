// Create src/app/api/test-email/route.ts for testing
import { NextRequest, NextResponse } from 'next/server'
import { testEmailConfiguration, sendVerificationEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing email configuration...')
    
    // Test basic configuration
    const isConfigValid = await testEmailConfiguration()
    
    if (!isConfigValid) {
      return NextResponse.json({
        success: false,
        error: 'Email configuration test failed'
      }, { status: 500 })
    }

    // Try sending a test email
    const testEmail = 'your-test-email@example.com' // Replace with your email
    await sendVerificationEmail(testEmail, 'Test User', 'test-token-123')

    return NextResponse.json({
      success: true,
      message: 'Email configuration test passed and test email sent',
      config: {
        smtpHost: process.env.SMTP_HOST,
        smtpPort: process.env.SMTP_PORT,
        hasUser: !!process.env.SMTP_USER,
        hasPass: !!process.env.SMTP_PASS,
        fromEmail: process.env.FROM_EMAIL,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL
      }
    })

  } catch (error) {
    console.error('Email test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}