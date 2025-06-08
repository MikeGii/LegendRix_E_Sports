// scripts/check-env.js
// Run this to check if your environment variables are loaded

console.log('🔍 Checking environment variables...\n');

// Check if .env.local file exists
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

console.log(`📄 .env.local file exists: ${envExists ? '✅ YES' : '❌ NO'}`);

if (envExists) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log(`📝 .env.local file size: ${envContent.length} characters`);
  
  // Check for key variables (without showing values)
  const hasPostgresUrl = envContent.includes('POSTGRES_URL=');
  const hasJwtSecret = envContent.includes('JWT_SECRET=');
  
  console.log(`🔑 Contains POSTGRES_URL: ${hasPostgresUrl ? '✅ YES' : '❌ NO'}`);
  console.log(`🔑 Contains JWT_SECRET: ${hasJwtSecret ? '✅ YES' : '❌ NO'}`);
}

console.log('\n🔍 Environment variables loaded by Node.js:');
console.log(`POSTGRES_URL: ${process.env.POSTGRES_URL ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✅ SET (hidden)' : '❌ NOT SET'}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);

console.log('\n💡 Next steps:');
if (!envExists) {
  console.log('1. Create .env.local file in your project root');
  console.log('2. Add your Neon database credentials');
} else if (!process.env.POSTGRES_URL) {
  console.log('1. Check that POSTGRES_URL is properly set in .env.local');
  console.log('2. Make sure there are no spaces around the = sign');
  console.log('3. Restart your terminal/command prompt');
}