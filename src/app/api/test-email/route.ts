// src/app/api/test-email/route.ts - Enhanced debugging version

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
  console.log('🔍 Starting Zone.eu email test...')
  
  try {
    // Log all environment variables (without sensitive data)
    console.log('📋 Environment check:', {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT,
      SMTP_USER: process.env.SMTP_USER,
      FROM_EMAIL: process.env.FROM_EMAIL,
      hasPassword: !!process.env.SMTP_PASS,
      passwordLength: process.env.SMTP_PASS?.length || 0,
      NODE_ENV: process.env.NODE_ENV
    })

    // Create transporter with detailed logging
    const config = {
      host: process.env.SMTP_HOST || 'smtp.zone.eu',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // Zone.eu port 465 requires secure
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: true, // Enable debug
      logger: true, // Enable logging
      tls: {
        rejectUnauthorized: false, // For Zone.eu compatibility
        servername: 'smtp.zone.eu'
      }
    }

    console.log('⚙️ Transporter config:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      hasPassword: !!config.auth.pass,
      debug: config.debug,
      logger: config.logger
    })

    const transporter = nodemailer.createTransport(config)

    // Test 1: Verify connection
    console.log('🔗 Testing SMTP connection...')
    try {
      await transporter.verify()
      console.log('✅ SMTP connection successful!')
    } catch (verifyError) {
      console.error('❌ SMTP connection failed:', verifyError)
      return NextResponse.json({
        success: false,
        step: 'connection',
        error: verifyError instanceof Error ? verifyError.message : 'Connection failed',
        details: verifyError
      }, { status: 500 })
    }

    // Test 2: Send test email
    console.log('📧 Sending test email...')
    const testEmail = process.env.SMTP_USER // Send to yourself for testing
    
    const mailOptions = {
      from: `"E-WRC Test" <${process.env.FROM_EMAIL}>`,
      to: testEmail,
      subject: '🧪 Zone.eu SMTP Test - ' + new Date().toISOString(),
      html: `
        <h2>Zone.eu SMTP Test</h2>
        <p>This is a test email sent at: ${new Date().toISOString()}</p>
        <p>If you receive this, Zone.eu SMTP is working correctly!</p>
        <hr>
        <small>
          Host: ${config.host}<br>
          Port: ${config.port}<br>
          Secure: ${config.secure}<br>
          User: ${config.auth.user}
        </small>
      `,
      text: `Zone.eu SMTP Test sent at ${new Date().toISOString()}`
    }

    console.log('📤 Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    })

    try {
      const result = await transporter.sendMail(mailOptions)
      console.log('✅ Email sent successfully:', {
        messageId: result.messageId,
        response: result.response,
        accepted: result.accepted,
        rejected: result.rejected
      })

      return NextResponse.json({
        success: true,
        message: 'Zone.eu email test successful!',
        details: {
          messageId: result.messageId,
          response: result.response,
          accepted: result.accepted,
          rejected: result.rejected,
          config: {
            host: config.host,
            port: config.port,
            secure: config.secure,
            user: config.auth.user
          }
        }
      })

    } catch (sendError) {
      console.error('❌ Email sending failed:', sendError)
      return NextResponse.json({
        success: false,
        step: 'sending',
        error: sendError instanceof Error ? sendError.message : 'Send failed',
        details: sendError
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ General email test failed:', error)
    return NextResponse.json({
      success: false,
      step: 'general',
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 })
  }
}