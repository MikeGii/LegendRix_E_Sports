// scripts/test-db.js
// Enhanced database test script with proper environment loading

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { sql } = require('@vercel/postgres');

async function testDatabase() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Check if POSTGRES_URL is available
    if (!process.env.POSTGRES_URL) {
      console.error('❌ POSTGRES_URL environment variable is not set!');
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Make sure .env.local file exists in your project root');
      console.log('2. Check that POSTGRES_URL is set in .env.local');
      console.log('3. Format should be: POSTGRES_URL="postgresql://username:password@host:port/database"');
      console.log('4. Make sure there are no extra spaces around the = sign');
      return;
    }
    
    // Test basic connection
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    console.log('✅ Database connected successfully!');
    console.log('📅 Server time:', result.rows[0].current_time);
    console.log('🗃️ Database version:', result.rows[0].db_version.split(' ')[0]);
    
    // Test tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log('\n📋 Tables found:');
    if (tables.rows.length === 0) {
      console.log('⚠️ No tables found - you need to run the database schema initialization');
    } else {
      tables.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
    // Test admin user exists
    try {
      const adminUser = await sql`
        SELECT id, email, name, role, status, created_at
        FROM users 
        WHERE role = 'admin' 
        LIMIT 1
      `;
      
      if (adminUser.rows.length > 0) {
        console.log('\n👨‍💼 Admin user found:');
        console.log(`   Email: ${adminUser.rows[0].email}`);
        console.log(`   Name: ${adminUser.rows[0].name}`);
        console.log(`   Status: ${adminUser.rows[0].status}`);
        console.log(`   Created: ${adminUser.rows[0].created_at}`);
      } else {
        console.log('\n⚠️ No admin user found - you may need to run the initialization script');
      }
    } catch (userError) {
      console.log('\n⚠️ Could not check for admin user - users table may not exist yet');
      console.log('   This is normal if you haven\'t run the database schema yet');
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
    // Provide next steps
    if (tables.rows.length === 0) {
      console.log('\n📝 Next steps:');
      console.log('1. Run the database schema initialization SQL in your database console');
      console.log('2. Use DBeaver, pgAdmin, or Neon console to execute the schema');
      console.log('3. Then run this test again to verify everything works');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your .env.local file has the correct POSTGRES_URL');
    console.log('2. Verify your database is running in Vercel/Neon');
    console.log('3. Make sure your connection string includes the password');
    console.log('4. Try connecting with a database client first (DBeaver, pgAdmin)');
    console.log('5. Check if your IP is allowed (some providers have IP restrictions)');
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔑 Password issue detected:');
      console.log('- Double-check your database password in .env.local');
      console.log('- Make sure you copied the full connection string from Neon/Vercel');
    }
    
    if (error.message.includes('database does not exist')) {
      console.log('\n🗃️ Database issue detected:');
      console.log('- Verify the database name in your connection string');
      console.log('- Check if the database was created properly in Neon/Vercel');
    }
  }
}

testDatabase();