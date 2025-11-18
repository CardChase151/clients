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
    const { to, subject, personalMessage, changes, projectName, appUrl } = JSON.parse(event.body);

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
    const htmlBody = formatEmailHTML(personalMessage, changes, projectName, appUrl);

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      reply_to: 'chase@appcatalyst.org',
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

function formatEmailHTML(personalMessage, changes, projectName, appUrl) {
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
    .review { color: #F59E0B; }
    .review-done { color: #4ADE80; }
    .review-progress { color: #3B82F6; }
    .completed { color: #22C55E; }
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
      <h2>Project Update</h2>
      ${projectName ? `<p style="color: #666; font-size: 14px; margin-top: -10px;">Regarding: ${projectName}</p>` : ''}
    </div>

    <div class="message">${personalMessage}</div>

    ${appUrl ? `
    <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Here is the link to your app:</p>
      <a href="${appUrl}" style="color: #0066cc; font-weight: 600; font-size: 15px; text-decoration: none;">${appUrl}</a>
    </div>
    ` : ''}
`;

  // Add changes section if there are any
  if (changes && (changes.reviewTasks?.length > 0 || changes.reviewToDone?.length > 0 ||
      changes.reviewToProgress?.length > 0 || changes.completedTasks?.length > 0)) {

    html += `<div class="changes"><h3>Recent Progress</h3>`;

    // Items for review
    if (changes.reviewTasks?.length > 0) {
      const tasksByScreen = {};
      changes.reviewTasks.forEach(task => {
        const screenTitle = task.screen_title || 'Unknown Screen';
        if (!tasksByScreen[screenTitle]) {
          tasksByScreen[screenTitle] = [];
        }
        tasksByScreen[screenTitle].push(task);
      });

      html += `<div class="section">
        <div class="section-title review">ITEMS FOR YOUR REVIEW (${changes.reviewTasks.length})</div>`;

      Object.keys(tasksByScreen).forEach(screenTitle => {
        html += `<div style="margin-bottom: 12px;">
          <div style="font-weight: 600; color: #000; margin-bottom: 6px; padding-left: 8px;">${screenTitle}</div>
          ${tasksByScreen[screenTitle].map(task =>
            `<div class="item" style="padding-left: 24px;"><span style="color: #F59E0B;">○</span> ${task.title}</div>`
          ).join('')}
        </div>`;
      });

      html += `</div>`;
    }

    // Review → Done
    if (changes.reviewToDone?.length > 0) {
      const tasksByScreen = {};
      changes.reviewToDone.forEach(task => {
        const screenTitle = task.screen_title || 'Unknown Screen';
        if (!tasksByScreen[screenTitle]) {
          tasksByScreen[screenTitle] = [];
        }
        tasksByScreen[screenTitle].push(task);
      });

      html += `<div class="section">
        <div class="section-title review-done">APPROVED & COMPLETE (${changes.reviewToDone.length})</div>`;

      Object.keys(tasksByScreen).forEach(screenTitle => {
        html += `<div style="margin-bottom: 12px;">
          <div style="font-weight: 600; color: #000; margin-bottom: 6px; padding-left: 8px;">${screenTitle}</div>
          ${tasksByScreen[screenTitle].map(task =>
            `<div class="item" style="padding-left: 24px;"><span style="color: #4ADE80;">✓</span> ${task.title}</div>`
          ).join('')}
        </div>`;
      });

      html += `</div>`;
    }

    // Review → In Progress
    if (changes.reviewToProgress?.length > 0) {
      const tasksByScreen = {};
      changes.reviewToProgress.forEach(task => {
        const screenTitle = task.screen_title || 'Unknown Screen';
        if (!tasksByScreen[screenTitle]) {
          tasksByScreen[screenTitle] = [];
        }
        tasksByScreen[screenTitle].push(task);
      });

      html += `<div class="section">
        <div class="section-title review-progress">BACK IN DEVELOPMENT (${changes.reviewToProgress.length})</div>`;

      Object.keys(tasksByScreen).forEach(screenTitle => {
        html += `<div style="margin-bottom: 12px;">
          <div style="font-weight: 600; color: #000; margin-bottom: 6px; padding-left: 8px;">${screenTitle}</div>
          ${tasksByScreen[screenTitle].map(task =>
            `<div class="item" style="padding-left: 24px;"><span style="color: #3B82F6;">↻</span> ${task.title}</div>`
          ).join('')}
        </div>`;
      });

      html += `</div>`;
    }

    // Completed tasks (not from review)
    if (changes.completedTasks?.length > 0) {
      const tasksByScreen = {};
      changes.completedTasks.forEach(task => {
        const screenTitle = task.screen_title || 'Unknown Screen';
        if (!tasksByScreen[screenTitle]) {
          tasksByScreen[screenTitle] = [];
        }
        tasksByScreen[screenTitle].push(task);
      });

      html += `<div class="section">
        <div class="section-title completed">COMPLETED TASKS (${changes.completedTasks.length})</div>`;

      Object.keys(tasksByScreen).forEach(screenTitle => {
        html += `<div style="margin-bottom: 12px;">
          <div style="font-weight: 600; color: #000; margin-bottom: 6px; padding-left: 8px;">${screenTitle}</div>
          ${tasksByScreen[screenTitle].map(task =>
            `<div class="item" style="padding-left: 24px;"><span style="color: #22C55E;">✓</span> ${task.title}</div>`
          ).join('')}
        </div>`;
      });

      html += `</div>`;
    }

    html += `</div>`;
  }

  html += `
    <div class="footer">
      Best regards,<br>
      AppCatalyst Team<br><br>
      Questions? Reach me at my direct inbox: chase@appcatalyst.org
    </div>
  </div>
</body>
</html>
`;

  return html;
}
