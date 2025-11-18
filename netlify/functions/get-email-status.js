const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Fetch recent emails from Resend
    const emails = await resend.emails.list({ limit: 100 });

    return {
      statusCode: 200,
      body: JSON.stringify({ emails: emails.data })
    };

  } catch (error) {
    console.error('[GET EMAIL STATUS] Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to fetch email status',
        details: error.message
      })
    };
  }
};
