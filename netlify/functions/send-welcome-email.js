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

    const emailBody = `
${greeting}

Your account has been created!

**Login Details:**
URL: https://appcatalystclients.netlify.app
Email: ${to}
Temporary Password: ${password}

**Getting Started:**
1. Fill out your profile with your information
2. Change your password in the Account tab at the bottom

**We Track 3 Basic Phases:**

**1. Discovery** - Understanding Your Vision
- Learn your goals and objectives
- Research your industry and market
- Understand how users will interact with your app
- Analyze how your company and team work together

**2. Proposal** - Planning Your Solution
- Comprehensive project proposal will be sent to you
- We'll review it together and answer all your questions
- Finalize scope, timeline, and approach

**3. Invoice** - Final Payment
- Final invoice sent
- Project will start shortly after this based on project timeline

**Task Manager:**
You'll have access to a full task manager where you can see your app being built in real-time. Track screens, features, and progress as they're being developed.

If you have any questions, feel free to reply to this email.

Best regards,
AppCatalyst Team
    `.trim();

    // Send email via Resend
    const data = await resend.emails.send({
      from: 'AppCatalyst <noreply@appcatalyst.org>',
      to: [to],
      subject: 'Welcome to AppCatalyst - Your Account Details',
      text: emailBody,
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
