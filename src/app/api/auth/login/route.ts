import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { ApiResponseBuilder } from '@/lib/api-response'
import { handleApiError } from '@/lib/errors'
import { validateInput, loginSchema } from '@/lib/validation'
import { performance } from '@/lib/performance'

export async function POST(request: NextRequest) {
  const requestId = `login_${Date.now()}`
  const requestLogger = logger.withContext(requestId)
  
  try {
    // Validate input
    const body = await request.json()
    const { email, password } = validateInput(loginSchema, body)
    
    requestLogger.info('Login attempt started', { email })
    
    // Track performance
    const result = await performance.track('user_login', async () => {
      // Get user with improved error handling
      const user = await db.getUserByEmail(email)
      if (!user) {
        requestLogger.warn('Login failed - user not found', { email })
        throw new AuthenticationError('Invalid email or password')
      }

      // Check password
      const passwordValid = await bcrypt.compare(password, user.password_hash)
      if (!passwordValid) {
        requestLogger.warn('Login failed - invalid password', { email })
        throw new AuthenticationError('Invalid email or password')
      }

      // Check approval status
      if (user.role !== 'admin' && user.status !== 'approved') {
        let message = 'Account not approved'
        
        if (!user.email_verified) {
          message = 'Please verify your email address before logging in'
        } else if (!user.admin_approved) {
          message = 'Your account is pending admin approval'
        } else if (user.status === 'rejected') {
          message = 'Your account has been rejected'
        }

        requestLogger.warn('Login failed - account not approved', { 
          email, 
          status: user.status,
          emailVerified: user.email_verified,
          adminApproved: user.admin_approved
        })
        
        throw new AuthorizationError(message)
      }

      return user
    })

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.id, 
        email: result.email, 
        role: result.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    requestLogger.info('Login successful', { userId: result.id, role: result.role })

    return NextResponse.json(ApiResponseBuilder.success({
      token,
      user: {
        id: result.id,
        email: result.email,
        name: result.name,
        role: result.role,
        status: result.status,
        emailVerified: result.email_verified,
        adminApproved: result.admin_approved
      }
    }, 'Login successful'))

  } catch (error) {
    const { response, status } = handleApiError(error)
    requestLogger.error('Login failed', error)
    return NextResponse.json(response, { status })
  }
}