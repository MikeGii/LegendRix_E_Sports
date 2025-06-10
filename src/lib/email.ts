// src/lib/email.ts - Zone.eu optimized version

import nodemailer from 'nodemailer'

// Zone.eu specific email configuration
const createTransporter = () => {
  // Zone.eu SMTP settings
  const config = {
    host: 'smtp.zone.eu', // Fixed Zone.eu host
    port: 465, // Zone.eu secure port
    secure: true, // Required for port 465
    auth: {
      user: process.env.SMTP_USER, // noreply-ewrc@ideemoto.ee
      pass: process.env.SMTP_PASS, // Your Zone password
    },
    tls: {
      rejectUnauthorized: false, // Zone.eu compatibility
      servername: 'smtp.zone.eu'
    },
    // Enable debugging in development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  }

  console.log('🔧 Zone.eu SMTP Config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    hasPassword: !!config.auth.pass,
    passwordLength: config.auth.pass?.length || 0
  })

  return nodemailer.createTransport(config)
}

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply-ewrc@ideemoto.ee'

// Base URL handling
const getBaseUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  
  if (baseUrl) {
    if (baseUrl.startsWith('http')) {
      return baseUrl.replace(/\/$/, '')
    }
    return `https://${baseUrl}`.replace(/\/$/, '')
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return 'https://legend-rix-e-sports.vercel.app'
}

// Enhanced email sending with detailed Zone.eu error handling
const sendEmailWithRetry = async (mailOptions: any, retries = 2) => {
  const transporter = createTransporter()
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📧 Zone.eu attempt ${attempt}/${retries}:`, {
        to: mailOptions.to,
        subject: mailOptions.subject,
        from: mailOptions.from
      })
      
      // Test connection first
      console.log('🔗 Verifying Zone.eu connection...')
      await transporter.verify()
      console.log('✅ Zone.eu connection verified')
      
      // Send email
      const result = await transporter.sendMail(mailOptions)
      console.log('✅ Zone.eu email sent:', {
        messageId: result.messageId,
        response: result.response,
        accepted: result.accepted,
        rejected: result.rejected
      })
      
      return result
    } catch (error) {
      console.error(`❌ Zone.eu attempt ${attempt} failed:`, {
        error: error instanceof Error ? error.message : error,
        code: error instanceof Error && 'code' in error ? error.code : 'unknown',
        command: error instanceof Error && 'command' in error ? error.command : 'unknown'
      })
      
      // Log specific Zone.eu errors
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          console.error('🔑 Zone.eu authentication error - check SMTP_USER and SMTP_PASS')
        }
        if (error.message.includes('connect')) {
          console.error('🌐 Zone.eu connection error - check network/firewall')
        }
        if (error.message.includes('timeout')) {
          console.error('⏰ Zone.eu timeout error - server may be slow')
        }
      }
      
      if (attempt === retries) {
        console.error('❌ All Zone.eu attempts failed')
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 3000 * attempt))
    }
  }
}

// Verification email
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const baseUrl = getBaseUrl()
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`
  
  console.log('📧 Preparing Zone.eu verification email:', {
    to: email,
    from: FROM_EMAIL,
    baseUrl,
    verificationUrl
  })
  
  const mailOptions = {
    from: `"E-WRC Rally Registration" <${FROM_EMAIL}>`,
    to: email,
    subject: '🏁 E-WRC Rally Registration - Verify Your Email',
    text: `
Hello ${name}!

Welcome to the E-WRC Rally Registration system! 

Please verify your email address by clicking this link:
${verificationUrl}

After email verification, your account will be reviewed by our admin team.

If you didn't create this account, you can safely ignore this email.
This verification link will expire in 24 hours.

E-WRC Rally Registration System
E-Sports Rally Championship
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🏁 E-WRC Rally Registration</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">E-Sports Rally Championship</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hello ${name}!</h2>
          
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Welcome to the E-WRC Rally Registration system! To complete your registration 
            and start your journey in the world of e-sports rally racing, please verify 
            your email address.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #16a34a; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      display: inline-block;">
              ✅ Verify Email Address
            </a>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-weight: 500;">
              ⚠️ Next Steps After Verification:
            </p>
            <p style="color: #92400e; margin: 5px 0 0 0;">
              After email verification, your account will be reviewed by our admin team 
              before you can access the full registration system.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            If you didn't create this account, you can safely ignore this email.
            This verification link will expire in 24 hours.
          </p>
          
          <p style="color: #64748b; font-size: 14px;">
            Having trouble with the button? Copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #2563eb;">${verificationUrl}</span>
          </p>
        </div>
        
        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8;">
          <p style="margin: 0; font-size: 14px;">
            E-WRC Rally Registration System<br>
            E-Sports Rally Championship
          </p>
        </div>
      </div>
    `
  }

  return await sendEmailWithRetry(mailOptions)
}

// Approval email
export async function sendApprovalEmail(email: string, name: string) {
  const baseUrl = getBaseUrl()
  
  console.log('📧 Preparing Zone.eu approval email:', {
    to: email,
    from: FROM_EMAIL
  })
  
  const mailOptions = {
    from: `"E-WRC Rally Registration" <${FROM_EMAIL}>`,
    to: email,
    subject: '🎉 E-WRC Rally Registration - Account Approved!',
    text: `
Congratulations ${name}!

Your E-WRC Rally Registration account has been approved! You now have full access to the registration system.

You can now:
- Register for upcoming rally championships
- View and manage your registrations  
- Access community features
- Update your driver profile

Login at: ${baseUrl}

Welcome to the E-WRC community!

E-WRC Rally Registration System
E-Sports Rally Championship
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🏁 E-WRC Rally Registration</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">E-Sports Rally Championship</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Congratulations ${name}! 🎉</h2>
          
          <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0;">
            <p style="color: #15803d; margin: 0; font-weight: bold; font-size: 18px;">
              ✅ Your account has been approved!
            </p>
          </div>
          
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Great news! Your E-WRC Rally Registration account has been approved by our admin team. 
            You now have full access to the registration system and can start participating in 
            e-sports rally championships.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}" 
               style="background: #2563eb; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      display: inline-block;">
              🚀 Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #475569; line-height: 1.6;">
            Welcome to the E-WRC community! We're excited to have you on board and look 
            forward to seeing you compete in upcoming championships.
          </p>
        </div>
        
        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8;">
          <p style="margin: 0; font-size: 14px;">
            E-WRC Rally Registration System<br>
            E-Sports Rally Championship
          </p>
        </div>
      </div>
    `
  }

  return await sendEmailWithRetry(mailOptions)
}

// Rejection email
export async function sendRejectionEmail(email: string, name: string, reason?: string) {
  console.log('📧 Preparing Zone.eu rejection email:', {
    to: email,
    from: FROM_EMAIL
  })
  
  const mailOptions = {
    from: `"E-WRC Rally Registration" <${FROM_EMAIL}>`,
    to: email,
    subject: 'E-WRC Rally Registration - Application Update',
    text: `
Hello ${name},

Thank you for your interest in the E-WRC Rally Registration system. After careful review, we regret to inform you that your application has not been approved at this time.

${reason ? `Reason for rejection: ${reason}` : ''}

If you have questions about this decision or would like to appeal, please contact our support team.

We appreciate your understanding and encourage you to reapply in the future if circumstances change.

E-WRC Rally Registration System
E-Sports Rally Championship
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🏁 E-WRC Rally Registration</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">E-Sports Rally Championship</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin-bottom: 20px;">Hello ${name}</h2>
          
          <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">
            Thank you for your interest in the E-WRC Rally Registration system. 
            After careful review, we regret to inform you that your application 
            has not been approved at this time.
          </p>
          
          ${reason ? `
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="color: #991b1b; margin: 0; font-weight: 500;">
              Reason for rejection:
            </p>
            <p style="color: #991b1b; margin: 5px 0 0 0;">
              ${reason}
            </p>
          </div>
          ` : ''}
          
          <p style="color: #475569; line-height: 1.6;">
            We appreciate your understanding and encourage you to reapply in the future 
            if circumstances change.
          </p>
        </div>
        
        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8;">
          <p style="margin: 0; font-size: 14px;">
            E-WRC Rally Registration System<br>
            E-Sports Rally Championship
          </p>
        </div>
      </div>
    `
  }

  return await sendEmailWithRetry(mailOptions)
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    console.log('🧪 Testing Zone.eu configuration...')
    const transporter = createTransporter()
    await transporter.verify()
    console.log('✅ Zone.eu email configuration verified')
    return true
  } catch (error) {
    console.error('❌ Zone.eu email configuration failed:', error)
    return false
  }
}