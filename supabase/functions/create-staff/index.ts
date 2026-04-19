import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, corsHeaders } from '../_shared/cors.ts';

interface CreateStaffRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'staff';
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Create a client for validating the user token
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Verify the request is from an authenticated admin user
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);

    console.log('User validation:', { userId: user?.id, error: userError?.message });

    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    // Create a client that uses the user's JWT so RLS sees auth.uid()
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if user is admin using RLS-aware client
    const { data: roles, error: rolesError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('Roles check:', { roles, rolesError: rolesError?.message });

    const isAdmin = roles?.some((r: { role: string }) => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can create staff accounts');
    }

    // Create a service role client for admin operations
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
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
