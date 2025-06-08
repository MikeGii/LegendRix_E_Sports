// scripts/complete-schema.js
// This script will complete your database setup

require('dotenv').config({ path: '.env.local' });
const { sql } = require('@vercel/postgres');

async function completeSchema() {
  try {
    console.log('🏗️ Completing database schema setup...\n');

    // Step 1: Create missing tables
    console.log('📋 Creating email_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        email_type VARCHAR(50) NOT NULL,
        recipient_email VARCHAR(255) NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced'))
      )
    `;
    console.log('✅ email_logs table created');

    console.log('📋 Creating admin_actions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS admin_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        reason TEXT,
        performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ admin_actions table created');

    // Step 2: Create indexes
    console.log('📋 Creating database indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_admin_approved ON users(admin_approved)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_verification_token ON users(email_verification_token)`;
    console.log('✅ Database indexes created');

    // Step 3: Create admin user
    console.log('👨‍💼 Creating admin user...');
    const adminResult = await sql`
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
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig8jxb4uYK',
        'System Administrator',
        'admin',
        'approved',
        true,
        true
      ) 
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        email_verified = EXCLUDED.email_verified,
        admin_approved = EXCLUDED.admin_approved
      RETURNING id, email, name
    `;
    console.log('✅ Admin user created/updated:', adminResult.rows[0]);

    // Step 4: Verify everything
    console.log('\n🔍 Verifying database setup...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 All tables:');
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    const adminUser = await sql`
      SELECT email, name, role, status, email_verified, admin_approved 
      FROM users 
      WHERE role = 'admin'
    `;
    
    console.log('\n👨‍💼 Admin user details:');
    if (adminUser.rows.length > 0) {
      const admin = adminUser.rows[0];
      console.log(`   Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Status: ${admin.status}`);
      console.log(`   Email Verified: ${admin.email_verified}`);
      console.log(`   Admin Approved: ${admin.admin_approved}`);
    }

    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log(`\n📊 Total users in database: ${userCount.rows[0].count}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n🔑 Admin Login Credentials:');
    console.log('   Email: admin@ewrc.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!');

    console.log('\n✅ Your E-WRC Rally Registration system is ready!');
    console.log('🚀 You can now run: npm run dev');

  } catch (error) {
    console.error('❌ Schema completion failed:', error);
    console.log('\n🔧 Error details:', error.message);
  }
}

completeSchema();