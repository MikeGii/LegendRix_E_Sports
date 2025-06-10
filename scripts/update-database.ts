// scripts/update-database.ts
// Run this with: npx tsx scripts/update-database.ts

import { sql } from '@vercel/postgres'

async function updateDatabase() {
  try {
    console.log('🔄 Starting database update...')
    
    // Check if admin_actions table has metadata column
    try {
      await sql`SELECT metadata FROM admin_actions LIMIT 1`
      console.log('✅ admin_actions.metadata column exists')
    } catch (error) {
      console.log('➕ Adding metadata column to admin_actions...')
      await sql`ALTER TABLE admin_actions ADD COLUMN metadata JSONB DEFAULT '{}'`
      console.log('✅ Added metadata column')
    }
    
    // Check if rallies table exists
    try {
      await sql`SELECT rally_id FROM rallies LIMIT 1`
      console.log('✅ rallies table exists')
    } catch (error) {
      console.log('➕ Creating rallies table...')
      await sql`
        CREATE TABLE rallies (
          rally_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          rally_game_id UUID REFERENCES rally_games(id) ON DELETE CASCADE,
          rally_type_id UUID REFERENCES rally_types(id) ON DELETE CASCADE,
          rally_date TIMESTAMP NOT NULL,
          registration_ending_date TIMESTAMP NOT NULL,
          optional_notes TEXT,
          status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
          cancellation_reason TEXT,
          cancelled_by UUID REFERENCES users(id) ON DELETE SET NULL,
          cancelled_at TIMESTAMP,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT valid_dates CHECK (registration_ending_date < rally_date)
        )
      `
      console.log('✅ Created rallies table')
    }
    
    // Update any users stuck in wrong status
    const updateResult = await sql`
      UPDATE users 
      SET status = CASE 
        WHEN email_verified = true AND admin_approved = true THEN 'approved'
        WHEN email_verified = true AND admin_approved = false THEN 'pending_approval'
        WHEN email_verified = false THEN 'pending_email'
        ELSE status
      END
      WHERE status != CASE 
        WHEN email_verified = true AND admin_approved = true THEN 'approved'
        WHEN email_verified = true AND admin_approved = false THEN 'pending_approval'
        WHEN email_verified = false THEN 'pending_email'
        ELSE status
      END
    `
    
    if (updateResult.rowCount > 0) {
      console.log(`✅ Updated ${updateResult.rowCount} user status records`)
    }
    
    console.log('✅ Database update completed successfully!')
    
  } catch (error) {
    console.error('❌ Database update failed:', error)
    process.exit(1)
  }
}

updateDatabase()