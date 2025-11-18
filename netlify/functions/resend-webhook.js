const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  console.log('[RESEND WEBHOOK] ========== WEBHOOK CALLED ==========');
  console.log('[RESEND WEBHOOK] Method:', event.httpMethod);
  console.log('[RESEND WEBHOOK] Body:', event.body);

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    console.log('[RESEND WEBHOOK] ❌ Method not allowed');
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body);
    console.log('[RESEND WEBHOOK] ✅ Received event:', payload.type);
    console.log('[RESEND WEBHOOK] Full payload:', JSON.stringify(payload, null, 2));

    // Initialize Supabase - use the exact env var names from Netlify
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    console.log('[RESEND WEBHOOK] Supabase URL exists:', !!supabaseUrl);
    console.log('[RESEND WEBHOOK] Supabase Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      console.error('[RESEND WEBHOOK] ❌ Missing Supabase credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase not configured' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract email and event type
    const { type, data } = payload;
    const emailTo = data?.to?.[0]; // Get first recipient

    if (!emailTo) {
      console.log('[RESEND WEBHOOK] No recipient found in payload');
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailTo)
      .single();

    if (userError || !user) {
      console.log('[RESEND WEBHOOK] User not found for email:', emailTo);
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    }

    // Update user based on event type
    let updateData = {};

    switch (type) {
      case 'email.sent':
      case 'email.delivered':
        updateData.last_email_status = type === 'email.sent' ? 'sent' : 'delivered';
        break;

      case 'email.opened':
        updateData.last_email_status = 'opened';
        updateData.last_email_opened_date = new Date().toISOString();
        console.log('[RESEND WEBHOOK] Email opened by:', emailTo);
        break;

      case 'email.clicked':
        updateData.last_email_status = 'clicked';
        if (!updateData.last_email_opened_date) {
          updateData.last_email_opened_date = new Date().toISOString();
        }
        console.log('[RESEND WEBHOOK] Email clicked by:', emailTo);
        break;

      default:
        console.log('[RESEND WEBHOOK] Unhandled event type:', type);
        return {
          statusCode: 200,
          body: JSON.stringify({ received: true })
        };
    }

    // Update user in database
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('[RESEND WEBHOOK] Error updating user:', updateError);
    } else {
      console.log('[RESEND WEBHOOK] Updated user:', user.id, updateData);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    console.error('[RESEND WEBHOOK] Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
