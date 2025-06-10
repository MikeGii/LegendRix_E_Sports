// Create src/app/api/test-db/route.ts for testing
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const healthCheck = await db.healthCheck()
    console.log('Health check result:', healthCheck)

    // Check if users table exists
    const tableCheck = await sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `
    
    // Get user count
    const userCount = await sql`SELECT COUNT(*) as count FROM users`
    
    // Get recent users
    const recentUsers = await sql`
      SELECT id, email, name, status, email_verified, admin_approved, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `

    // Test pending users function
    const pendingUsers = await db.getPendingUsers()

    return NextResponse.json({
      success: true,
      database: {
        health: healthCheck,
        usersTableExists: tableCheck.rows.length > 0,
        usersTableColumns: tableCheck.rows,
        totalUsers: parseInt(userCount.rows[0]?.count || '0'),
        recentUsers: recentUsers.rows,
        pendingUsersCount: pendingUsers.length,
        pendingUsers: pendingUsers.slice(0, 3) // Show first 3 for testing
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        postgresUrlPrefix: process.env.POSTGRES_URL?.substring(0, 20) + '...'
      }
    })

  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasPostgresUrl: !!process.env.POSTGRES_URL
      }
    }, { status: 500 })
  }
}