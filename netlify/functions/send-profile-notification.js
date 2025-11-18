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
    const {
      email,
      firstName,
      lastName,
      company,
      phone,
      appName
    } = JSON.parse(event.body);

    // Validate required fields
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    const userName = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown User';

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #000; border-bottom: 2px solid #0066cc; padding-bottom: 8px;">Profile Completed</h2>

  <p>A user has completed their profile:</p>

  <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #000; margin-top: 0;">User Information</h3>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #555;">Name:</td>
        <td style="padding: 8px 0;">${userName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
        <td style="padding: 8px 0;">${email}</td>
      </tr>
      ${phone ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #555;">Phone:</td>
        <td style="padding: 8px 0;">${phone}</td>
      </tr>
      ` : ''}
      ${company ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #555;">Company:</td>
        <td style="padding: 8px 0;">${company}</td>
      </tr>
      ` : ''}
      ${appName ? `
      <tr>
        <td style="padding: 8px 0; font-weight: bold; color: #555;">App Name:</td>
        <td style="padding: 8px 0;">${appName}</td>
      </tr>
      ` : ''}
    </table>
  </div>

  <p style="background-color: #f0f8ff; padding: 12px; border-left: 3px solid #0066cc; margin: 24px 0; font-size: 14px;">
    <strong>Next Steps:</strong> Review the user's profile in the admin dashboard and proceed with the onboarding process as needed.
  </p>

  <p style="margin-top: 24px; color: #666; font-size: 14px;">
    View in dashboard: <a href="https://projects.appcatalyst.org" style="color: #0066cc;">https://projects.appcatalyst.org</a>
  </p>
</body>
</html>
    `.trim();

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: ['chase@appcatalyst.org'], // Your K2 email
      subject: `Profile Completed - ${userName}`,
      html: htmlBody,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };

  } catch (error) {
    console.error('Error sending profile notification:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send notification' })
    };
  }
};
