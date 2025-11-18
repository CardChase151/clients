const { Resend } = require('resend');

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
    const { to, firstName, password } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Build email body
    const greeting = firstName ? `Hi ${firstName},` : 'Hello,';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>

  <p>Your account has been created!</p>

  <h3 style="color: #000; margin-top: 24px;">Login Details:</h3>
  <p style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 12px 0;">
    <strong>URL:</strong> <a href="https://projects.appcatalyst.org" style="color: #0066cc;">https://projects.appcatalyst.org</a><br>
    <strong>Email:</strong> ${to}<br>
    <strong>Temporary Password:</strong> ${password}
  </p>

  <h3 style="color: #000; margin-top: 24px;">Getting Started:</h3>
  <ol style="margin: 12px 0; padding-left: 20px;">
    <li>Fill out your profile with your information</li>
    <li>Change your password in the Account tab at the bottom</li>
  </ol>

  <h3 style="color: #000; margin-top: 24px;">Our Typical Process May Include:</h3>

  <div style="margin: 16px 0;">
    <h4 style="color: #000; margin: 12px 0;">1. Discovery - Understanding Your Vision</h4>
    <ul style="margin: 8px 0; padding-left: 20px;">
      <li>Learn your goals and objectives</li>
      <li>Research your industry and market</li>
      <li>Understand how users will interact with your app</li>
      <li>Analyze how your company and team work together</li>
    </ul>
  </div>

  <div style="margin: 16px 0;">
    <h4 style="color: #000; margin: 12px 0;">2. Proposal - Planning Your Solution</h4>
    <ul style="margin: 8px 0; padding-left: 20px;">
      <li>Comprehensive project proposal will be sent to you</li>
      <li>We'll review it together and answer all your questions</li>
      <li>Finalize scope, timeline, and approach</li>
    </ul>
  </div>

  <div style="margin: 16px 0;">
    <h4 style="color: #000; margin: 12px 0;">3. Invoice - Final Payment</h4>
    <ul style="margin: 8px 0; padding-left: 20px;">
      <li>Final invoice sent</li>
      <li>Project will start shortly after this based on project timeline</li>
    </ul>
  </div>

  <h3 style="color: #000; margin-top: 24px;">Task Manager:</h3>
  <p>You'll have access to a full task manager where you can see your app being built in real-time. Track screens, features, and progress as they're being developed.</p>

  <p style="background-color: #f0f8ff; padding: 12px; border-left: 3px solid #0066cc; margin: 24px 0; font-size: 14px; color: #555;">
    <strong>Note:</strong> This email is sent to everyone who has an account with us for transparency. We realize you may be in contact with us and have a more personalized experience that may not reflect this exactly.
  </p>

  <p style="margin-top: 24px;">If you have any questions, feel free to reply to this email.</p>

  <p style="margin-top: 24px;">
    Best regards,<br>
    <strong>AppCatalyst Team</strong>
  </p>
</body>
</html>
    `.trim();

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      subject: 'Welcome to AppCatalyst - Your Account Details',
      html: htmlBody,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email' })
    };
  }
};
