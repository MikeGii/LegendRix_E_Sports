require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testEmail() {
  try {
    console.log('📧 Testing Zone email configuration...\n');

    // Check environment variables
    console.log('🔍 Checking email environment variables:');
    console.log(`   SMTP_HOST: ${process.env.SMTP_HOST || '❌ NOT SET'}`);
    console.log(`   SMTP_PORT: ${process.env.SMTP_PORT || '❌ NOT SET'}`);
    console.log(`   SMTP_USER: ${process.env.SMTP_USER || '❌ NOT SET'}`);
    console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET'}`);
    console.log(`   FROM_EMAIL: ${process.env.FROM_EMAIL || '❌ NOT SET'}`);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('\n❌ Email credentials not configured!');
      return;
    }

    // Create transporter (FIXED: createTransport not createTransporter)
    console.log('\n🔧 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.zone.eu',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: parseInt(process.env.SMTP_PORT || '465') === 465, // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Test connection
    console.log('🔌 Testing Zone SMTP connection...');
    await transporter.verify();
    console.log('✅ Zone SMTP connection successful!');

    // Send test email
    console.log('📧 Sending test email via Zone...');
    const testEmail = 'noreply-ewrc@ideemoto.ee' {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself
      subject: '🏁 E-WRC Rally Registration - Zone Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🏁 E-WRC Rally Registration</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Zone Email Test Successful!</p>
          </div>
          
          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: #1e293b; margin-bottom: 20px;">✅ Zone Email Working!</h2>
            
            <p style="color: #475569; line-height: 1.6;">
              Excellent! Your Zone email service (${process.env.SMTP_HOST}) is working perfectly 
              with the E-WRC Rally Registration system.
            </p>
            
            <div style="background: #dcfce7; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
              <p style="color: #15803d; margin: 0; font-weight: 500;">
                📧 Email Configuration:
              </p>
              <ul style="color: #15803d; margin: 10px 0; padding-left: 20px;">
                <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                <li>From Email: ${process.env.FROM_EMAIL}</li>
                <li>Status: ✅ Working</li>
              </ul>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
              Your rally registration system can now send verification emails and notifications!
              Test completed at: ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="background: #1e293b; padding: 20px; text-align: center; color: #94a3b8;">
            <p style="margin: 0; font-size: 14px;">
              E-WRC Rally Registration System<br>
              Powered by Zone Email Service
            </p>
          </div>
        </div>
      `,
      text: `
E-WRC Rally Registration - Zone Email Test

✅ Zone Email Working!

Your Zone email service is working perfectly with the E-WRC Rally Registration system.

Configuration:
- SMTP Host: ${process.env.SMTP_HOST}
- SMTP Port: ${process.env.SMTP_PORT}  
- From Email: ${process.env.FROM_EMAIL}
- Status: ✅ Working

Test completed at: ${new Date().toLocaleString()}

E-WRC Rally Registration System
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Zone test email sent successfully!');
    console.log(`📬 Message ID: ${result.messageId}`);
    console.log(`📧 Check your inbox: ${process.env.SMTP_USER}`);

    console.log('\n🎉 Zone email configuration test completed successfully!');
    console.log('📧 Your E-WRC app can now send emails via Zone!');

  } catch (error) {
    console.error('❌ Zone email test failed:', error.message);
    
    if (error.message.includes('Invalid login') || error.message.includes('authentication failed')) {
      console.log('\n🔧 Authentication Error:');
      console.log('- Check your Zone email and password');
      console.log('- Verify the email account exists and is active');
      console.log('- Try logging into your email via webmail first');
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Connection Error:');
      console.log('- Check SMTP host: should be smtp.zone.eu or mail.zone.eu');
      console.log('- Try port 587 instead of 465');
      console.log('- Check your internet connection');
    } else if (error.message.includes('self signed certificate')) {
      console.log('\n🔧 SSL Certificate Error:');
      console.log('- Try adding: rejectUnauthorized: false to SMTP config');
      console.log('- Or try port 587 with secure: false');
    }
  }
}

testEmail();