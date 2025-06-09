// scripts/detect-smtp.js
// Help detect SMTP settings for your Zone email

const nodemailer = require('nodemailer');

async function detectSMTP() {
  console.log('🔍 SMTP Settings Detector for Zone Email\n');
  
  console.log('📝 To find your Zone SMTP settings, try these steps:\n');
  
  console.log('1️⃣ **Check Zone Control Panel:**');
  console.log('   - Login to your Zone account/control panel');
  console.log('   - Look for "Email Settings", "SMTP", or "Mail Configuration"');
  console.log('   - Note down the SMTP server and port');
  
  console.log('\n2️⃣ **Common Zone SMTP Settings to Try:**');
  
  const commonSettings = [
    {
      name: 'Zone Standard',
      host: 'smtp.zone.eu',
      port: 587,
      secure: false
    },
    {
      name: 'Zone Alternative 1',
      host: 'mail.zone.eu', 
      port: 587,
      secure: false
    },
    {
      name: 'Zone SSL',
      host: 'smtp.zone.eu',
      port: 465,
      secure: true
    },
    {
      name: 'Custom Domain',
      host: 'smtp.yourdomain.com',
      port: 587,
      secure: false
    }
  ];
  
  commonSettings.forEach((setting, index) => {
    console.log(`   ${index + 1}. ${setting.name}:`);
    console.log(`      Host: ${setting.host}`);
    console.log(`      Port: ${setting.port}`);
    console.log(`      Secure: ${setting.secure}`);
    console.log('');
  });
  
  console.log('3️⃣ **Test Configuration:**');
  console.log('   Update your .env.local with:');
  console.log('   ```');
  console.log('   SMTP_HOST="smtp.zone.eu"');
  console.log('   SMTP_PORT="587"');
  console.log('   SMTP_USER="your-email@yourdomain.com"');
  console.log('   SMTP_PASS="your-email-password"');
  console.log('   FROM_EMAIL="your-email@yourdomain.com"');
  console.log('   ```');
  console.log('');
  console.log('   Then run: node scripts/test-smtp-zone.js');
  
  console.log('\n4️⃣ **Need Help Finding Settings?**');
  console.log('   - Contact Zone support');
  console.log('   - Check your email client settings (Outlook, Thunderbird)');
  console.log('   - Look in Zone documentation/FAQ');
}

async function testZoneConnection(host, port, secure, user, pass) {
  try {
    console.log(`🔌 Testing ${host}:${port} (SSL: ${secure})...`);
    
    const transporter = nodemailer.createTransporter({
      host: host,
      port: port,
      secure: secure,
      auth: {
        user: user,
        pass: pass,
      },
    });
    
    await transporter.verify();
    console.log('✅ Connection successful!');
    return true;
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return false;
  }
}

// If you want to test specific settings, uncomment and modify this:
async function testMyZoneSettings() {
  // Replace with your actual email and password
  const email = 'your-email@yourdomain.com';
  const password = 'your-password';
  
  if (email === 'your-email@yourdomain.com') {
    console.log('\n⚠️ Please update the email and password in this script first');
    return;
  }
  
  console.log('\n🧪 Testing your Zone settings...\n');
  
  const settings = [
    { host: 'smtp.zone.eu', port: 587, secure: false },
    { host: 'mail.zone.eu', port: 587, secure: false },
    { host: 'smtp.zone.eu', port: 465, secure: true },
  ];
  
  for (const setting of settings) {
    const success = await testZoneConnection(
      setting.host, 
      setting.port, 
      setting.secure, 
      email, 
      password
    );
    
    if (success) {
      console.log('\n🎉 Working configuration found!');
      console.log('Add this to your .env.local:');
      console.log(`SMTP_HOST="${setting.host}"`);
      console.log(`SMTP_PORT="${setting.port}"`);
      console.log(`SMTP_USER="${email}"`);
      console.log(`SMTP_PASS="${password}"`);
      console.log(`FROM_EMAIL="${email}"`);
      break;
    }
  }
}

detectSMTP();

// Uncomment the line below and update credentials to test
// testMyZoneSettings();