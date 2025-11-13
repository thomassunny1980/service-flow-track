import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateStaffRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'staff';
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can create staff accounts');
    }

    const { email, password, fullName, role }: CreateStaffRequest = await req.json();

    if (!email || !password || !fullName || !role) {
      throw new Error('Email, password, fullName, and role are required');
    }

    if (role !== 'admin' && role !== 'staff') {
      throw new Error('Role must be either admin or staff');
    }

    // Server-side password validation for security
    if (password.length < 12) {
      throw new Error('Password must be at least 12 characters long');
    }
    if (password.length > 72) {
      throw new Error('Password must not exceed 72 characters');
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('Failed to create user');
    }

    // Assign role
    await supabaseClient.from('user_roles').insert({
      user_id: newUser.user.id,
      role,
    });

    // Profile is automatically created by the handle_new_user() trigger

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
