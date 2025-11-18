const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, firstName } = JSON.parse(event.body);

    // Validate required fields
    if (!to) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email address is required' })
      };
    }

    // Build email body
    const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>

  <p><strong>Great news!</strong> Your account has been approved.</p>

  <p>You can now create and manage your app projects with AppCatalyst.</p>

  <div style="background-color: #f0f8ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 24px 0;">
    <h3 style="color: #000; margin-top: 0; font-size: 18px;">What's Next?</h3>
    <ul style="margin: 12px 0; padding-left: 20px; color: #333;">
      <li style="margin-bottom: 8px;">Log in to your account at <a href="https://projects.appcatalyst.org" style="color: #3B82F6;">projects.appcatalyst.org</a></li>
      <li style="margin-bottom: 8px;">Create your first project</li>
      <li style="margin-bottom: 8px;">Track your app development progress in real-time</li>
      <li style="margin-bottom: 8px;">Collaborate with our team as we build your vision</li>
    </ul>
  </div>

  <p>We're excited to work with you and bring your app to life!</p>

  <p style="margin-top: 24px;">If you have any questions, feel free to reply to this email.</p>

  <p style="margin-top: 24px;">
    Best regards,<br>
    <strong>AppCatalyst Team</strong>
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
    <p style="margin: 0;">AppCatalyst - Building Your Vision</p>
    <p style="margin: 4px 0 0 0;">
      <a href="https://appcatalyst.org" style="color: #3B82F6; text-decoration: none;">appcatalyst.org</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      subject: 'Your AppCatalyst Account Has Been Approved!',
      html: htmlBody,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };

  } catch (error) {
    console.error('Error sending approval email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email' })
    };
  }
};
