import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, corsHeaders } from '../_shared/cors.ts';

interface EditStaffRequest {
  userId: string;
  email?: string;
  fullName?: string;
  role?: 'admin' | 'staff';
  password?: string;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
  }

  try {
    // Create a service role client for admin operations (bypasses RLS)
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
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    console.log('User validation:', { userId: user?.id, error: userError?.message });

    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    // Check if user is admin using service role client (bypasses RLS)
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('Roles check:', { roles, rolesError: rolesError?.message });

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can edit staff accounts');
    }

    const { userId, email, fullName, role, password }: EditStaffRequest = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Editing user:', { userId, email, fullName, role, passwordProvided: !!password });

    // Build a single auth update object with all changes
    const authUpdate: Record<string, any> = {};
    
    if (email) {
      authUpdate.email = email;
    }
    
    if (password) {
      authUpdate.password = password;
    }
    
    if (fullName) {
      authUpdate.user_metadata = { full_name: fullName };
    }

    // Perform a single updateUserById call with all auth changes
    if (Object.keys(authUpdate).length > 0) {
      console.log('Updating auth user with fields:', Object.keys(authUpdate));
      const { error: authError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        authUpdate
      );

      if (authError) {
        console.error('Auth update error:', authError);
        throw new Error(`Failed to update user: ${authError.message}`);
      }
      console.log('Auth user updated successfully');
    }

    // Update profiles table
    const profileUpdate: Record<string, any> = {};
    if (fullName) profileUpdate.full_name = fullName;
    if (email) profileUpdate.email = email;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
    }

    // Update role if provided
    if (role) {
      const { error: roleError } = await supabaseClient
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);

      if (roleError) {
        console.error('Role update error:', roleError);
        throw new Error(`Failed to update role: ${roleError.message}`);
      }
    }

    console.log('User updated successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in edit-staff function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...headers, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});