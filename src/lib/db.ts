import { sql } from '@vercel/postgres'
import { VercelPoolClient } from '@vercel/postgres'
import { AppError } from './errors'
import { logger } from './logger'

// Core interfaces
export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  role: 'user' | 'admin'
  status: 'pending_email' | 'pending_approval' | 'approved' | 'rejected' // Updated status values
  email_verified: boolean
  admin_approved: boolean
  email_verification_token?: string
  email_verification_expires?: Date
  created_at: Date
  updated_at: Date
}

export interface EmailLog {
  id: string
  user_id: string
  email_type: string
  recipient_email: string
  sent_at: Date
  status: 'sent' | 'failed' | 'bounced'
}

export interface AdminAction {
  id: string
  admin_id: string
  target_user_id: string
  action: string
  reason?: string
  performed_at: Date
}

// Database operation result types
export interface DatabaseResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface UserFilters {
  role?: 'user' | 'admin'
  status?: User['status']
  emailVerified?: boolean
  adminApproved?: boolean
}

// Enhanced Database Class
class DatabaseService {
  /**
   * Execute a function within a database transaction
   * Note: Vercel Postgres doesn't support traditional transactions in serverless,
   * but we can simulate it with careful error handling and rollback logic
   */
  async withTransaction<T>(
    operation: () => Promise<T>,
    rollbackActions?: Array<() => Promise<void>>
  ): Promise<T> {
    try {
      logger.info('Starting database transaction')
      const result = await operation()
      logger.info('Database transaction completed successfully')
      return result
    } catch (error) {
      logger.error('Database transaction failed, attempting rollback:', error)
      
      if (rollbackActions) {
        for (const rollback of rollbackActions) {
          try {
            await rollback()
          } catch (rollbackError) {
            logger.error('Rollback action failed:', rollbackError)
          }
        }
      }
      
      throw error
    }
  }

  /**
   * Execute a query with proper error handling and logging
   */
  private async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<{ rows: T[]; rowCount: number }>
  ): Promise<{ rows: T[]; rowCount: number }> {
    try {
      logger.info(`Executing query: ${queryName}`)
      const result = await queryFn()
      logger.info(`Query ${queryName} completed successfully`, {
        rowCount: result.rowCount
      })
      return result
    } catch (error) {
      logger.error(`Query ${queryName} failed:`, error)
      
      // Map common database errors to user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('unique constraint')) {
          throw new AppError('Resource already exists', 409, 'DUPLICATE_RESOURCE')
        }
        if (error.message.includes('foreign key constraint')) {
          throw new AppError('Referenced resource not found', 404, 'REFERENCE_NOT_FOUND')
        }
        if (error.message.includes('connection')) {
          throw new AppError('Database connection failed', 503, 'DATABASE_UNAVAILABLE')
        }
      }
      
      throw new AppError('Database operation failed', 500, 'DATABASE_ERROR')
    }
  }

  // ======================
  // USER OPERATIONS
  // ======================

    /**
   * Enhanced createUser with better token generation and error logging
   */
  async createUser(email: string, passwordHash: string, name: string): Promise<User & { email_verification_token?: string }> {
    try {
      console.log('🔄 Creating user:', { email, name })
      
      // Generate verification token
      const token = this.generateSecureToken()
      const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      console.log('🔑 Generated verification token:', {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 8) + '...',
        expiresAt: expirationDate.toISOString()
      })

      const result = await this.executeQuery(
        'createUser',
        () => sql`
          INSERT INTO users (
            email, 
            password_hash, 
            name, 
            email_verification_token, 
            email_verification_expires
          )
          VALUES (${email}, ${passwordHash}, ${name}, ${token}, ${expirationDate.toISOString()})
          RETURNING 
            id, 
            email, 
            name, 
            role, 
            status, 
            email_verified, 
            admin_approved, 
            email_verification_token,
            created_at, 
            updated_at
        `
      )

      if (result.rows.length === 0) {
        throw new AppError('Failed to create user', 500, 'USER_CREATION_FAILED')
      }

      const user = result.rows[0] as User & { email_verification_token?: string }
      
      console.log('✅ User created successfully:', { 
        id: user.id, 
        email: user.email,
        hasVerificationToken: !!user.email_verification_token,
        tokenLength: user.email_verification_token?.length || 0
      })
      
      // Verify the token was saved correctly
      if (!user.email_verification_token) {
        console.error('❌ CRITICAL: User created but verification token missing from response!', {
          userId: user.id,
          email: user.email,
          providedToken: token.substring(0, 8) + '...'
        })
        
        // Try to fetch the user again to see if token exists in DB
        const checkUser = await sql`SELECT email_verification_token FROM users WHERE id = ${user.id}`
        console.log('🔍 Database check for token:', {
          foundToken: !!checkUser.rows[0]?.email_verification_token,
          tokenPreview: checkUser.rows[0]?.email_verification_token?.substring(0, 8) + '...'
        })
        
        // Add the token to the response manually if it exists in DB
        if (checkUser.rows[0]?.email_verification_token) {
          user.email_verification_token = checkUser.rows[0].email_verification_token
        }
      }
      
      return user
    } catch (error) {
      console.error('❌ Failed to create user:', error)
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        throw new AppError('User with this email already exists', 409, 'DUPLICATE_EMAIL')
      }
      
      throw error
    }
  }

  /**
   * Get user by email with caching consideration
   */
  async getUserByEmail(email: string): Promise<User | null> {
    if (!email?.trim()) {
      throw new AppError('Email is required', 400, 'INVALID_EMAIL')
    }

    const result = await this.executeQuery(
      'getUserByEmail',
      () => sql`SELECT * FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
    )

    return result.rows[0] as User || null
  }

  /**
   * Get user by ID with validation
   */
  async getUserById(id: string): Promise<User | null> {
    if (!id?.trim()) {
      throw new AppError('User ID is required', 400, 'INVALID_USER_ID')
    }

    const result = await this.executeQuery(
      'getUserById',
      () => sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`
    )

    return result.rows[0] as User || null
  }

  /**
   * Get multiple users with filters and pagination
   */
  async getUsers(
    filters: UserFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination

    const offset = (page - 1) * limit

    // Build WHERE clause dynamically
    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (filters.role) {
      whereConditions.push(`role = $${paramIndex}`)
      queryParams.push(filters.role)
      paramIndex++
    }

    if (filters.status) {
      whereConditions.push(`status = $${paramIndex}`)
      queryParams.push(filters.status)
      paramIndex++
    }

    if (filters.emailVerified !== undefined) {
      whereConditions.push(`email_verified = $${paramIndex}`)
      queryParams.push(filters.emailVerified)
      paramIndex++
    }

    if (filters.adminApproved !== undefined) {
      whereConditions.push(`admin_approved = $${paramIndex}`)
      queryParams.push(filters.adminApproved)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    // Get total count
    const countResult = await this.executeQuery(
      'getUsersCount',
      () => sql.query(`
        SELECT COUNT(*) as total 
        FROM users 
        ${whereClause}
      `, queryParams)
    )

    const total = parseInt(countResult.rows[0]?.total || '0')

    // Get users
    const usersResult = await this.executeQuery(
      'getUsers',
      () => sql.query(`
        SELECT * FROM users 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, limit, offset])
    )

    return {
      users: usersResult.rows as User[],
      total,
      page,
      limit
    }
  }

  /**
   * Get pending users - IMPROVED VERSION
   */
  async getPendingUsers(): Promise<User[]> {
    try {
      console.log('Fetching pending users...')
      
      const result = await sql`
        SELECT 
          id,
          email,
          name,
          role,
          status,
          email_verified,
          admin_approved,
          email_verification_token,
          email_verification_expires,
          created_at,
          updated_at
        FROM users 
        WHERE (
          -- Users who need email verification
          (email_verified = false AND status = 'pending_email')
          OR 
          -- Users who verified email but need admin approval
          (email_verified = true AND admin_approved = false AND status = 'pending_approval')
          OR
          -- Users in any pending state
          status IN ('pending_email', 'pending_approval')
        )
        AND role = 'user'  -- Don't include admins
        ORDER BY created_at DESC
      `

      console.log('Retrieved pending users:', result.rows.length)
      return result.rows as User[]
    } catch (error) {
      console.error('Error in getPendingUsers:', error)
      throw error
    }
  }

  /**
   * Verify email with token validation
   */
  async verifyEmail(token: string): Promise<boolean> {
    if (!token?.trim()) {
      throw new AppError('Verification token is required', 400, 'INVALID_TOKEN')
    }

    const result = await this.executeQuery(
      'verifyEmail',
      () => sql`
        UPDATE users 
        SET 
          email_verified = true, 
          email_verification_token = NULL,
          email_verification_expires = NULL,
          status = CASE 
            WHEN admin_approved = true THEN 'approved'
            ELSE 'pending_approval'
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE email_verification_token = ${token} 
          AND email_verification_expires > NOW()
          AND email_verified = false
        RETURNING id
      `
    )

    return result.rowCount > 0
  }

    /**
   * Approve user with transaction-like behavior - FIXED VERSION
   */
    async approveUser(userId: string, adminId: string, reason?: string): Promise<boolean> {
      try {
        console.log('Starting user approval:', { userId, adminId, reason })
        
        // First, get the current user to check their state
        const currentUser = await sql`SELECT * FROM users WHERE id = ${userId}`
        
        if (currentUser.rows.length === 0) {
          console.log('User not found for approval:', userId)
          throw new AppError('User not found', 404, 'USER_NOT_FOUND')
        }
        
        const user = currentUser.rows[0]
        console.log('Current user state:', {
          id: user.id,
          email: user.email,
          email_verified: user.email_verified,
          admin_approved: user.admin_approved,
          status: user.status
        })
        
        // Update the user - set both admin_approved AND status correctly
        const userResult = await sql`
          UPDATE users 
          SET 
            admin_approved = true,
            status = 'approved', // Always set to 'approved'
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
          RETURNING *
        `

        if (userResult.rowCount === 0) {
          console.log('Failed to update user during approval')
          throw new AppError('Failed to update user', 500, 'UPDATE_FAILED')
        }

        const updatedUser = userResult.rows[0]
        console.log('User updated successfully:', {
          id: updatedUser.id,
          email: updatedUser.email,
          email_verified: updatedUser.email_verified,
          admin_approved: updatedUser.admin_approved,
          status: updatedUser.status
        })

        // Log the admin action
        const actionResult = await sql`
          INSERT INTO admin_actions (admin_id, target_user_id, action, reason)
          VALUES (${adminId}, ${userId}, 'approve', ${reason || null})
          RETURNING *
        `
        
        console.log('Admin action logged:', actionResult.rows[0])
        
        return true
      } catch (error) {
        console.error('Error in approveUser:', error)
        throw error
      }
    }

  /**
   * Reject user with transaction-like behavior - FIXED VERSION
   */
  async rejectUser(userId: string, adminId: string, reason?: string): Promise<boolean> {
    try {
      console.log('Starting user rejection:', { userId, adminId, reason })
      
      // First, update the user status
      const userResult = await sql`
        UPDATE users 
        SET 
          admin_approved = false,
          status = 'rejected',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING *
      `

      if (userResult.rowCount === 0) {
        console.log('User not found for rejection:', userId)
        throw new AppError('User not found or already processed', 404, 'USER_NOT_FOUND')
      }

      const updatedUser = userResult.rows[0]
      console.log('User rejected successfully:', {
        id: updatedUser.id,
        email: updatedUser.email,
        status: updatedUser.status
      })

      // Log the admin action
      await sql`
        INSERT INTO admin_actions (admin_id, target_user_id, action, reason)
        VALUES (${adminId}, ${userId}, 'reject', ${reason || null})
      `

      return true
    } catch (error) {
      console.error('Error in rejectUser:', error)
      throw error
    }
  }
  /**
   * Update user profile
   */
  async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User> {
    const setClause: string[] = []
    const queryParams: any[] = []
    let paramIndex = 1

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramIndex}`)
      queryParams.push(updates.name)
      paramIndex++
    }

    if (updates.email !== undefined) {
      setClause.push(`email = $${paramIndex}`)
      queryParams.push(updates.email)
      paramIndex++
    }

    if (setClause.length === 0) {
      throw new AppError('No updates provided', 400, 'NO_UPDATES')
    }

    setClause.push(`updated_at = CURRENT_TIMESTAMP`)
    queryParams.push(userId) // Add userId for WHERE clause

    const result = await this.executeQuery(
      'updateUser',
      () => sql.query(`
        UPDATE users 
        SET ${setClause.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, queryParams)
    )

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND')
    }

    return result.rows[0] as User
  }

  /**
   * Soft delete user (mark as inactive)
   */
  async deactivateUser(userId: string, adminId: string, reason?: string): Promise<boolean> {
    return this.withTransaction(async () => {
      const result = await this.executeQuery(
        'deactivateUser',
        () => sql`
          UPDATE users 
          SET 
            status = 'rejected',
            admin_approved = false,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId} AND status != 'rejected'
          RETURNING id
        `
      )

      if (result.rowCount === 0) {
        throw new AppError('User not found or already deactivated', 404, 'USER_NOT_FOUND')
      }

      // Log the admin action
      await this.logAdminAction(adminId, userId, 'deactivate', reason)

      return true
    })
  }

  // ======================
  // EMAIL OPERATIONS
  // ======================

  /**
   * Log email sending attempts
   */
  async logEmail(
    userId: string, 
    emailType: string, 
    recipientEmail: string, 
    status: 'sent' | 'failed' | 'bounced' = 'sent'
  ): Promise<void> {
    await this.executeQuery(
      'logEmail',
      () => sql`
        INSERT INTO email_logs (user_id, email_type, recipient_email, status)
        VALUES (${userId}, ${emailType}, ${recipientEmail}, ${status})
      `
    )
  }

  /**
   * Get email logs for a user
   */
  async getEmailLogs(userId: string, limit: number = 50): Promise<EmailLog[]> {
    const result = await this.executeQuery(
      'getEmailLogs',
      () => sql`
        SELECT * FROM email_logs 
        WHERE user_id = ${userId}
        ORDER BY sent_at DESC
        LIMIT ${limit}
      `
    )

    return result.rows as EmailLog[]
  }

  /**
   * Get email delivery statistics
   */
  async getEmailStats(days: number = 30): Promise<{
    total: number
    sent: number
    failed: number
    bounced: number
  }> {
    const result = await this.executeQuery(
      'getEmailStats',
      () => sql`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced
        FROM email_logs 
        WHERE sent_at >= NOW() - INTERVAL ${days} DAY
      `
    )

    const stats = result.rows[0] || { total: 0, sent: 0, failed: 0, bounced: 0 }
    return {
      total: parseInt(stats.total || '0'),
      sent: parseInt(stats.sent || '0'),
      failed: parseInt(stats.failed || '0'),
      bounced: parseInt(stats.bounced || '0')
    }
  }

  // ======================
  // ADMIN OPERATIONS
  // ======================

  /**
   * Log admin actions with enhanced tracking
   */
  async logAdminAction(
    adminId: string, 
    targetUserId: string, 
    action: string, 
    reason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.executeQuery(
      'logAdminAction',
      () => sql`
        INSERT INTO admin_actions (admin_id, target_user_id, action, reason, metadata)
        VALUES (${adminId}, ${targetUserId}, ${action}, ${reason || null}, ${JSON.stringify(metadata || {})})
      `
    )
  }

  /**
   * Get admin action history
   */
  async getAdminActions(
    options: {
      adminId?: string
      targetUserId?: string
      action?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<AdminAction[]> {
    const { adminId, targetUserId, action, limit = 100, offset = 0 } = options

    let whereConditions: string[] = []
    let queryParams: any[] = []
    let paramIndex = 1

    if (adminId) {
      whereConditions.push(`admin_id = $${paramIndex}`)
      queryParams.push(adminId)
      paramIndex++
    }

    if (targetUserId) {
      whereConditions.push(`target_user_id = $${paramIndex}`)
      queryParams.push(targetUserId)
      paramIndex++
    }

    if (action) {
      whereConditions.push(`action = $${paramIndex}`)
      queryParams.push(action)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    const result = await this.executeQuery(
      'getAdminActions',
      () => sql.query(`
        SELECT 
          aa.*,
          au.name as admin_name,
          au.email as admin_email,
          tu.name as target_user_name,
          tu.email as target_user_email
        FROM admin_actions aa
        LEFT JOIN users au ON aa.admin_id = au.id
        LEFT JOIN users tu ON aa.target_user_id = tu.id
        ${whereClause}
        ORDER BY aa.performed_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...queryParams, limit, offset])
    )

    return result.rows as AdminAction[]
  }

  // ======================
  // UTILITY METHODS
  // ======================

  /**
   * Generate a cryptographically secure token
   */
  private generateSecureToken(): string {
    const crypto = require('crypto')
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    const start = Date.now()
    
    try {
      await this.executeQuery(
        'healthCheck',
        () => sql`SELECT 1 as health_check`
      )
      
      const latency = Date.now() - start
      return { status: 'healthy', latency }
    } catch (error) {
      logger.error('Database health check failed:', error)
      return { status: 'unhealthy', latency: Date.now() - start }
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalUsers: number
    pendingUsers: number
    approvedUsers: number
    rejectedUsers: number
    emailsSentToday: number
  }> {
    const [userStats, emailStats] = await Promise.all([
      this.executeQuery(
        'getUserStats',
        () => sql`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN status = 'pending_email' OR status = 'pending_approval' THEN 1 END) as pending_users,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_users,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_users
          FROM users
        `
      ),
      this.executeQuery(
        'getEmailStatsToday',
        () => sql`
          SELECT COUNT(*) as emails_sent_today
          FROM email_logs 
          WHERE sent_at >= CURRENT_DATE
            AND status = 'sent'
        `
      )
    ])

    const userStatsRow = userStats.rows[0] || {}
    const emailStatsRow = emailStats.rows[0] || {}

    return {
      totalUsers: parseInt(userStatsRow.total_users || '0'),
      pendingUsers: parseInt(userStatsRow.pending_users || '0'),
      approvedUsers: parseInt(userStatsRow.approved_users || '0'),
      rejectedUsers: parseInt(userStatsRow.rejected_users || '0'),
      emailsSentToday: parseInt(emailStatsRow.emails_sent_today || '0')
    }
  }

  /**
   * Clean up expired verification tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.executeQuery(
      'cleanupExpiredTokens',
      () => sql`
        UPDATE users 
        SET 
          email_verification_token = NULL,
          email_verification_expires = NULL
        WHERE email_verification_expires < NOW()
          AND email_verification_token IS NOT NULL
        RETURNING id
      `
    )

    logger.info(`Cleaned up ${result.rowCount} expired verification tokens`)
    return result.rowCount
  }
}

// Export singleton instance
export const db = new DatabaseService()

// Export the class for testing purposes
export { DatabaseService }

// Legacy compatibility - keeping the old interface
export const legacyDb = {
  createUser: (email: string, passwordHash: string, name: string) => 
    db.createUser(email, passwordHash, name),
  getUserByEmail: (email: string) => 
    db.getUserByEmail(email),
  getUserById: (id: string) => 
    db.getUserById(id),
  verifyEmail: (token: string) => 
    db.verifyEmail(token),
  getPendingUsers: () => 
    db.getPendingUsers(),
  approveUser: (userId: string) => 
    db.approveUser(userId, 'system'),
  rejectUser: (userId: string) => 
    db.rejectUser(userId, 'system'),
  logEmail: (userId: string, emailType: string, recipientEmail: string, status?: 'sent' | 'failed' | 'bounced') =>
    db.logEmail(userId, emailType, recipientEmail, status),
  logAdminAction: (adminId: string, targetUserId: string, action: string, reason?: string) =>
    db.logAdminAction(adminId, targetUserId, action, reason)
}

// Initialize database function (for future migrations)
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Database initialization check')
    const health = await db.healthCheck()
    
    if (health.status === 'healthy') {
      logger.info(`Database is healthy (latency: ${health.latency}ms)`)
      
      // Run cleanup tasks
      await db.cleanupExpiredTokens()
    } else {
      throw new AppError('Database is not healthy', 503, 'DATABASE_UNHEALTHY')
    }
  } catch (error) {
    logger.error('Database initialization failed:', error)
    throw error
  }
}