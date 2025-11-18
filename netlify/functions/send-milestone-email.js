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
    const { to, firstName, subject, message, pdfBase64, pdfFilename, userId } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !subject || !message) {
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

  <p style="white-space: pre-line;">${message}</p>

  <p style="margin-top: 24px;">If you have any questions, feel free to reach out anytime.</p>

  <p style="margin-top: 24px;">
    Best regards,<br>
    <strong>AppCatalyst Team</strong>
  </p>
</body>
</html>
    `.trim();

    // Prepare email options
    const emailOptions = {
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      subject: subject,
      html: htmlBody,
    };

    // Add PDF attachment if present
    if (pdfBase64 && pdfFilename) {
      emailOptions.attachments = [{
        filename: pdfFilename,
        content: pdfBase64,
      }];
    }

    // Send email via Resend
    const data = await resend.emails.send(emailOptions);

    // Save to email_history
    if (userId) {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('email_history').insert({
          user_id: userId,
          project_id: null,
          sent_by: userId,
          personal_message: message,
          changes_snapshot: {},
          email_subject: subject,
          email_sent_successfully: true
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data })
    };

  } catch (error) {
    console.error('Error sending milestone email:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to send email' })
    };
  }
};
