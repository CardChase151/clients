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
    const { email, password, fullName } = JSON.parse(event.body);

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

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email so they can log in immediately
      user_metadata: {
        full_name: fullName || ''
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: authError.message })
      };
    }

    // Insert user into users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        approved: true, // Auto-approve since admin is creating them
        is_admin: false
      });

    if (dbError) {
      console.error('Error creating user record:', dbError);
      // Try to delete the auth user if database insert fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: dbError.message })
      };
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
