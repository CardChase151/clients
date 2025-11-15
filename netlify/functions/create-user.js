const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, password, firstName, lastName } = JSON.parse(event.body);

    // Validate inputs
    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and password are required' })
      };
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'A user with this email already exists' })
      };
    }

    // Create the user in Supabase Auth
    // Note: A database trigger will automatically create the user record in the users table
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so they can log in immediately
      user_metadata: {
        first_name: firstName || '',
        last_name: lastName || ''
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: authError.message })
      };
    }

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the user to set approved=false (they need to wait) and is_admin=false
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        approved: false,  // NOT auto-approved - they wait in the onboarding process
        is_admin: false,
        discovery_complete: false,
        proposal_reviewed: false,
        invoice_fulfilled: false
      })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating user record:', updateError);
      // Still return success since the user was created
      console.log('User created but approval status not set');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: email
        }
      })
    };
  } catch (error) {
    console.error('Error in create-user function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Internal server error' })
    };
  }
};
