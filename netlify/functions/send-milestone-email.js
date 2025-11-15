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
    const { to, firstName, subject, message, pdfBase64, pdfFilename } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !subject || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Build email body
    const greeting = firstName ? `Hi ${firstName},` : 'Hello,';

    const emailBody = `
${greeting}

${message}

If you have any questions, feel free to reach out anytime.

Best regards,
AppCatalyst Team
    `.trim();

    // Prepare email options
    const emailOptions = {
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      subject: subject,
      text: emailBody,
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
