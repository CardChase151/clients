const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, firstName, type, fileUrl, pdfBase64, pdfFilename } = JSON.parse(event.body);

    if (!to || !type || (type !== 'proposal' && type !== 'invoice')) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build email content
    const greeting = firstName ? `Hi ${firstName},` : 'Hello,';

    let subject, mainMessage, closingNote;

    if (type === 'proposal') {
      subject = 'Your Project Proposal from AppCatalyst';
      mainMessage = 'It was great talking with you! I wanted to share your project proposal with you.';
      closingNote = 'Please take your time to review it, and let me know if you have any questions or need clarification on anything. Once we're aligned on the proposal, I'll send over the invoice so we can get started on bringing your vision to life.';
    } else {
      subject = 'Your Project Invoice from AppCatalyst';
      mainMessage = 'It was great reviewing the proposal with you! I'm excited to move forward with your project.';
      closingNote = 'Please review the invoice at your convenience. Once it's fulfilled, we'll begin work on your project. I'm looking forward to this partnership and can't wait to bring your vision to life!';
    }

    // Build file/link section
    let fileSection = '';
    if (fileUrl && pdfBase64) {
      // Both URL and file
      const linkText = type === 'proposal' ? 'View Your Proposal' : 'View Your Invoice';
      fileSection = `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <a href="${fileUrl}"
             style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px;">
            ${linkText}
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 12px;">Also attached as PDF to this email</p>
        </div>
      `;
    } else if (fileUrl) {
      // Just URL
      const linkText = type === 'proposal' ? 'View Your Proposal' : 'View Your Invoice';
      fileSection = `
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
          <a href="${fileUrl}"
             style="display: inline-block; background-color: #0066cc; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px;">
            ${linkText}
          </a>
        </div>
      `;
    } else if (pdfBase64) {
      // Just file
      fileSection = `
        <p style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center; color: #666;">
          ${type === 'proposal' ? 'Proposal' : 'Invoice'} attached to this email
        </p>
      `;
    }

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #000; margin: 0; font-size: 24px; font-weight: 600;">AppCatalyst</h2>
  </div>

  <p style="font-size: 16px;">${greeting}</p>

  <p style="font-size: 16px; line-height: 1.7;">${mainMessage}</p>

  ${fileSection}

  <p style="font-size: 16px; line-height: 1.7;">${closingNote}</p>

  <p style="font-size: 16px; line-height: 1.7; margin-top: 32px;">
    I'm looking forward to working together!
  </p>

  <p style="margin-top: 32px; font-size: 16px;">
    Best regards,<br>
    <strong>Chase Kellis</strong><br>
    <span style="color: #666; font-size: 14px;">AppCatalyst Team</span>
  </p>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 13px;">
    <p>Questions? Feel free to reply to this email or reach me directly at TheK2way17@gmail.com</p>
  </div>
</body>
</html>
    `.trim();

    // Build email payload
    const emailPayload = {
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      cc: ['thek2way17@gmail.com'],
      reply_to: 'TheK2way17@gmail.com',
      subject: subject,
      html: htmlBody
    };

    // Add PDF attachment if provided
    if (pdfBase64 && pdfFilename) {
      emailPayload.attachments = [
        {
          filename: pdfFilename,
          content: pdfBase64
        }
      ];
    }

    const data = await resend.emails.send(emailPayload);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, messageId: data.id })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to send email',
        details: error.message
      })
    };
  }
};
