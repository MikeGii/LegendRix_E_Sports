// src/lib/email.ts
import nodemailer from 'nodemailer'

// Email configuration with better error handling
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: parseInt(process.env.SMTP_PORT || '587') === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production' // More permissive in development
    }
  }

  console.log('Email config:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    hasUser: !!config.auth.user,
    hasPass: !!config.auth.pass
  })

  return nodemailer.createTransport(config)
}

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@ewrc.com'
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'https://legend-rix-e-sports.vercel.app/'

// Add proper protocol if missing
const getBaseUrl = () => {
  if (BASE_URL.startsWith('http')) {
    return BASE_URL
  }
  return process.env.NODE_ENV === 'production' ? `https://${BASE_URL}` : `http://${BASE_URL}`
}

// Enhanced email sending with better error handling
const sendEmailWithRetry = async (mailOptions: any, retries = 3) => {
  const transporter = createTransporter()
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Email attempt ${attempt}/${retries}:`, {
        to: mailOptions.to,
        subject: mailOptions.subject
      })
      
      // Verify connection first
      await transporter.verify()
      console.log('SMTP connection verified')
      
      const result = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return result
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error)
      
      if (attempt === retries) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// Email templates
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const baseUrl = getBaseUrl()
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`
  
  console.log('Sending verification email to:', email)
  console.log('Verification URL:', verificationUrl)
  
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: '🏁 E-WRC Rally Registration - Verify Your Email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🏁 E-WRC Rally Registration</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">E-Sports Rally Championship</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
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
            <span style="word-break: break-all;">${verificationUrl}</span>
          </p>
        </div>
        
        <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8;">
          <p style="margin: 0; font-size: 14px;">
            E-WRC Rally Registration System<br>
            E-Sports Rally Championship
          </p>
        </div>
      </div>
    `,
    text: `
Hello ${name}!

Welcome to the E-WRC Rally Registration system! Please verify your email address to complete your registration.

Verification link: ${verificationUrl}

After email verification, your account will be reviewed by our admin team before you can access the full registration system.

If you didn't create this account, you can safely ignore this email.
This verification link will expire in 24 hours.

E-WRC Rally Registration System
E-Sports Rally Championship
    `
  }

  return await sendEmailWithRetry(mailOptions)
}

export async function sendApprovalEmail(email: string, name: string) {
  const baseUrl = getBaseUrl()
  const loginUrl = baseUrl
  
  console.log('Sending approval email to:', email)
  
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: '🎉 E-WRC Rally Registration - Account Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🏁 E-WRC Rally Registration</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">E-Sports Rally Championship</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
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
            <a href="${loginUrl}" 
               style="background: #2563eb; color: white; padding: 15px 30px; 
                      text-decoration: none; border-radius: 8px; font-weight: bold;
                      display: inline-block;">
              🚀 Access Your Dashboard
            </a>
          </div>
          
          <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
            <p style="color: #0c4a6e; margin: 0; font-weight: 500;">
              🏆 What you can do now:
            </p>
            <ul style="color: #0c4a6e; margin: 10px 0; padding-left: 20px;">
              <li>Register for upcoming rally championships</li>
              <li>View and manage your registrations</li>
              <li>Access community features</li>
              <li>Update your driver profile</li>
            </ul>
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
    `,
    text: `
Congratulations ${name}!

Your E-WRC Rally Registration account has been approved! You now have full access to the registration system.

You can now:
- Register for upcoming rally championships
- View and manage your registrations  
- Access community features
- Update your driver profile

Login at: ${loginUrl}

Welcome to the E-WRC community!

E-WRC Rally Registration System
E-Sports Rally Championship
    `
  }

  return await sendEmailWithRetry(mailOptions)
}

export async function sendRejectionEmail(email: string, name: string, reason?: string) {
  console.log('Sending rejection email to:', email)
  
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'E-WRC Rally Registration - Application Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px;">🏁 E-WRC Rally Registration</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">E-Sports Rally Championship</p>
        </div>
        
        <div style="padding: 30px; background: #f8fafc;">
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
          
          <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0;">
            <p style="color: #0c4a6e; margin: 0; font-weight: 500;">
              📧 Questions or Appeals:
            </p>
            <p style="color: #0c4a6e; margin: 5px 0 0 0;">
              If you have questions about this decision or would like to appeal, 
              please contact our support team.
            </p>
          </div>
          
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
    `,
    text: `
Hello ${name},

Thank you for your interest in the E-WRC Rally Registration system. After careful review, we regret to inform you that your application has not been approved at this time.

${reason ? `Reason for rejection: ${reason}` : ''}

If you have questions about this decision or would like to appeal, please contact our support team.

We appreciate your understanding and encourage you to reapply in the future if circumstances change.

E-WRC Rally Registration System
E-Sports Rally Championship
    `
  }

  return await sendEmailWithRetry(mailOptions)
}

// Test email configuration
export async function testEmailConfiguration() {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('✅ Email configuration is working')
    return true
  } catch (error) {
    console.error('❌ Email configuration failed:', error)
    return false
  }
}