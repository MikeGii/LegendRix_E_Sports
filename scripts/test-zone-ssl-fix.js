// scripts/test-zone-ssl-fix.js
// Test Zone email with SSL certificate bypass

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testZoneWithSSLFix() {
  try {
    console.log('📧 Testing Zone email with SSL fixes...\n');

    const configurations = [
      {
        name: 'Port 587 (TLS)',
        config: {
          host: process.env.SMTP_HOST || 'smtp.zone.eu',
          port: 587,
          secure: false, // TLS
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      },
      {
        name: 'Port 465 (SSL) with certificate bypass',
        config: {
          host: process.env.SMTP_HOST || 'smtp.zone.eu',
          port: 465,
          secure: true, // SSL
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false // Bypass SSL certificate issues
          }
        }
      },
      {
        name: 'Alternative host mail.zone.eu (Port 587)',
        config: {
          host: 'mail.zone.eu',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        }
      }
    ];

    for (const {name, config} of configurations) {
      try {
        console.log(`🔌 Testing: ${name}...`);
        
        const transporter = nodemailer.createTransport(config);
        await transporter.verify();
        
        console.log(`✅ SUCCESS: ${name} works!`);
        
        // Try sending a test email
        console.log('📧 Sending test email...');
        const result = await transporter.sendMail({
          from: process.env.FROM_EMAIL || process.env.SMTP_USER,
          to: process.env.SMTP_USER,
          subject: '🏁 E-WRC Zone Email Test - SUCCESS',
          html: `
            <h2>✅ Zone Email Working!</h2>
            <p>Configuration: ${name}</p>
            <p>Host: ${config.host}</p>
            <p>Port: ${config.port}</p>
            <p>Secure: ${config.secure}</p>
            <p>Time: ${new Date().toLocaleString()}</p>
          `,
          text: `Zone Email Test Success!\nConfiguration: ${name}\nTime: ${new Date().toLocaleString()}`
        });
        
        console.log(`📬 Email sent! Message ID: ${result.messageId}`);
        console.log(`📧 Check your inbox: ${process.env.SMTP_USER}`);
        
        console.log('\n🎉 Working configuration found!');
        console.log('💡 Update your .env.local with these settings:');
        console.log(`SMTP_HOST="${config.host}"`);
        console.log(`SMTP_PORT="${config.port}"`);
        console.log(`# Add this line if using SSL bypass:`);
        if (config.tls?.rejectUnauthorized === false) {
          console.log(`SMTP_TLS_REJECT_UNAUTHORIZED="false"`);
        }
        
        return; // Stop testing once we find a working config
        
      } catch (error) {
        console.log(`❌ FAILED: ${name} - ${error.message}`);
        console.log('');
      }
    }
    
    console.log('❌ All configurations failed. Possible issues:');
    console.log('1. Check your Zone email credentials');
    console.log('2. Contact Zone support for SMTP settings');
    console.log('3. Try using a different email provider temporarily');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testZoneWithSSLFix();