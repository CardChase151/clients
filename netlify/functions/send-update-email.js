const { Resend } = require('resend');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, personalMessage, changes, projectName } = JSON.parse(event.body);

    // Validate inputs
    if (!to || !subject || !personalMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, personalMessage' })
      };
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Format the email body with HTML
    const htmlBody = formatEmailHTML(personalMessage, changes, projectName);

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      reply_to: 'TheK2way17@gmail.com',
      subject: subject,
      html: htmlBody
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: data.id
      })
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

function formatEmailHTML(personalMessage, changes, projectName) {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { margin-bottom: 30px; }
    .message { margin-bottom: 30px; white-space: pre-wrap; }
    .changes { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .changes h3 { margin-top: 0; color: #000; font-size: 16px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: 600; font-size: 14px; margin-bottom: 10px; }
    .completed { color: #4ADE80; }
    .new-screen { color: #3B82F6; }
    .updated { color: #EAB308; }
    .new-task { color: #666; }
    .item { padding-left: 15px; margin-bottom: 5px; font-size: 14px; }
    .footer { color: #666; font-size: 13px; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Project Update - ${projectName || 'Your Project'}</h2>
    </div>

    <div class="message">${personalMessage}</div>
`;

  // Add changes section if there are any
  if (changes && (changes.completedTasks?.length > 0 || changes.newScreens?.length > 0 ||
      changes.updatedScreens?.length > 0 || changes.newTasks?.length > 0)) {

    html += `<div class="changes"><h3>Recent Progress</h3>`;

    // Completed tasks
    if (changes.completedTasks?.length > 0) {
      html += `
        <div class="section">
          <div class="section-title completed">COMPLETED TASKS (${changes.completedTasks.length})</div>
          ${changes.completedTasks.map(task => `<div class="item">✓ ${task.title}</div>`).join('')}
        </div>
      `;
    }

    // New screens
    if (changes.newScreens?.length > 0) {
      html += `
        <div class="section">
          <div class="section-title new-screen">NEW SCREENS (${changes.newScreens.length})</div>
          ${changes.newScreens.map(screen => `<div class="item">+ ${screen.title}</div>`).join('')}
        </div>
      `;
    }

    // Updated screens
    if (changes.updatedScreens?.length > 0) {
      html += `
        <div class="section">
          <div class="section-title updated">SCREENS UPDATED (${changes.updatedScreens.length})</div>
          ${changes.updatedScreens.map(screen =>
            `<div class="item">• ${screen.title}${screen.description ? ' - ' + screen.description : ''}</div>`
          ).join('')}
        </div>
      `;
    }

    // New tasks
    if (changes.newTasks?.length > 0) {
      html += `
        <div class="section">
          <div class="section-title new-task">NEW TASKS (${changes.newTasks.length})</div>
          ${changes.newTasks.map(task => `<div class="item">• ${task.title}</div>`).join('')}
        </div>
      `;
    }

    html += `</div>`;
  }

  html += `
    <div class="footer">
      Best regards,<br>
      AppCatalyst Team<br><br>
      Questions? Reply to this email or contact us at support@appcatalyst.com
    </div>
  </div>
</body>
</html>
`;

  return html;
}
