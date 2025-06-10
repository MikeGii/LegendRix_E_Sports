// Create a temporary API route to fix the admin password
// Save this as: src/app/api/fix-admin-password/route.ts

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sql } from '@vercel/postgres'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing admin password...')
    
    // Get the new password from request body
    const { newPassword } = await request.json()
    
    if (!newPassword) {
      return NextResponse.json({
        error: 'newPassword is required in request body'
      }, { status: 400 })
    }
    
    // First, let's check if admin user exists
    const existingAdmin = await sql`
      SELECT id, email, password_hash FROM users 
      WHERE email = 'admin@ewrc.com' AND role = 'admin'
    `
    
    if (existingAdmin.rows.length === 0) {
      console.log('❌ Admin user not found, creating one...')
      
      // Create admin user with new password
      const passwordHash = await bcrypt.hash(newPassword, 12)
      
      const result = await sql`
        INSERT INTO users (
          email, 
          password_hash, 
          name, 
          role, 
          status, 
          email_verified, 
          admin_approved
        ) VALUES (
          'admin@ewrc.com',
          ${passwordHash},
          'System Administrator',
          'admin',
          'approved',
          true,
          true
        )
        RETURNING id, email, name, role
      `
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        admin: result.rows[0],
        password: newPassword
      })
    } else {
      console.log('✅ Admin user found, updating password...')
      
      // Test the current password hash first
      const currentHash = existingAdmin.rows[0].password_hash
      const testPasswords = ['admin123', 'password', 'admin', newPassword]
      
      console.log('🧪 Testing current hash against common passwords...')
      for (const testPass of testPasswords) {
        const isValid = await bcrypt.compare(testPass, currentHash)
        console.log(`Password "${testPass}": ${isValid ? '✅ VALID' : '❌ Invalid'}`)
      }
      
      // Update to new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12)
      
      const updateResult = await sql`
        UPDATE users 
        SET password_hash = ${newPasswordHash},
            updated_at = CURRENT_TIMESTAMP
        WHERE email = 'admin@ewrc.com' AND role = 'admin'
        RETURNING id, email, name, role
      `
      
      // Test the new hash
      const testNewHash = await bcrypt.compare(newPassword, newPasswordHash)
      console.log(`New password hash test: ${testNewHash ? '✅ VALID' : '❌ Invalid'}`)
      
      return NextResponse.json({
        success: true,
        message: 'Admin password updated successfully',
        admin: updateResult.rows[0],
        password: newPassword,
        hashTest: testNewHash
      })
    }
    
  } catch (error) {
    console.error('❌ Failed to fix admin password:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also add a GET method to check current admin status
export async function GET() {
  try {
    const admin = await sql`
      SELECT id, email, name, role, status, email_verified, admin_approved, created_at
      FROM users 
      WHERE email = 'admin@ewrc.com'
    `
    
    if (admin.rows.length === 0) {
      return NextResponse.json({
        adminExists: false,
        message: 'No admin user found with email admin@ewrc.com'
      })
    }
    
    return NextResponse.json({
      adminExists: true,
      admin: admin.rows[0],
      message: 'Admin user found'
    })
    
  } catch (error) {
    console.error('Failed to check admin status:', error)
    return NextResponse.json({
      error: 'Failed to check admin status'
    }, { status: 500 })
  }
}