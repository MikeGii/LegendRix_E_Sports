import { sql } from '@vercel/postgres'

export interface User {
  id: string
  email: string
  password_hash: string
  name: string
  role: 'user' | 'admin'
  status: 'pending_email' | 'pending_approval' | 'approved' | 'rejected'
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

// Database operations
export const db = {
  // User operations
  async createUser(email: string, passwordHash: string, name: string): Promise<User> {
    const result = await sql`
      INSERT INTO users (email, password_hash, name, email_verification_token, email_verification_expires)
      VALUES (${email}, ${passwordHash}, ${name}, ${generateToken()}, ${new Date(Date.now() + 24 * 60 * 60 * 1000)})
      RETURNING *
    `
    return result.rows[0] as User
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email} LIMIT 1
    `
    return result.rows[0] as User || null
  },

  async getUserById(id: string): Promise<User | null> {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `
    return result.rows[0] as User || null
  },

  async verifyEmail(token: string): Promise<boolean> {
    const result = await sql`
      UPDATE users 
      SET email_verified = true, 
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
    return result.rowCount > 0
  },

  async getPendingUsers(): Promise<User[]> {
    const result = await sql`
      SELECT * FROM users 
      WHERE status IN ('pending_email', 'pending_approval')
      ORDER BY created_at DESC
    `
    return result.rows as User[]
  },

  async approveUser(userId: string): Promise<boolean> {
    const result = await sql`
      UPDATE users 
      SET admin_approved = true,
          status = CASE 
            WHEN email_verified = true THEN 'approved'
            ELSE 'pending_email'
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id
    `
    return result.rowCount > 0
  },

  async rejectUser(userId: string): Promise<boolean> {
    const result = await sql`
      UPDATE users 
      SET admin_approved = false,
          status = 'rejected',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
      RETURNING id
    `
    return result.rowCount > 0
  },

  // Email logging
  async logEmail(userId: string, emailType: string, recipientEmail: string, status: 'sent' | 'failed' | 'bounced' = 'sent'): Promise<void> {
    await sql`
      INSERT INTO email_logs (user_id, email_type, recipient_email, status)
      VALUES (${userId}, ${emailType}, ${recipientEmail}, ${status})
    `
  },

  // Admin actions logging
  async logAdminAction(adminId: string, targetUserId: string, action: string, reason?: string): Promise<void> {
    await sql`
      INSERT INTO admin_actions (admin_id, target_user_id, action, reason)
      VALUES (${adminId}, ${targetUserId}, ${action}, ${reason || null})
    `
  }
}

// Utility functions
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Initialize database (create tables if they don't exist)
export async function initializeDatabase() {
  try {
    // This would run your schema creation
    // In production, you'd typically run migrations separately
    console.log('Database initialization would run here')
    // You can copy the SQL from the schema file and run it here if needed
  } catch (error) {
    console.error('Database initialization failed:', error)
    throw error
  }
}