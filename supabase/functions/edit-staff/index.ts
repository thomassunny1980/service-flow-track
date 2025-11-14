import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface EditStaffRequest {
  userId: string;
  email?: string;
  fullName?: string;
  role?: 'admin' | 'staff';
  password?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Check if user is admin
    const { data: roles, error: rolesError } = await anonClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    console.log('Roles check:', { roles, rolesError: rolesError?.message });

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can edit staff accounts');
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

    const { userId, email, fullName, role, password }: EditStaffRequest = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Editing user:', { userId, email, fullName, role, passwordProvided: !!password });

    // Update email if provided
    if (email) {
      const { error: emailError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { email }
      );

      if (emailError) {
        console.error('Email update error:', emailError);
        throw new Error(`Failed to update email: ${emailError.message}`);
      }
    }

    // Update full name if provided
    if (fullName) {
      const { error: metadataError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { user_metadata: { full_name: fullName } }
      );

      if (metadataError) {
        console.error('Metadata update error:', metadataError);
        throw new Error(`Failed to update name: ${metadataError.message}`);
      }

      // Also update profiles table
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }
    }

    // Update email in profiles if provided
    if (email) {
      const { error: profileEmailError } = await supabaseClient
        .from('profiles')
        .update({ email })
        .eq('id', userId);

      if (profileEmailError) {
        console.error('Profile email update error:', profileEmailError);
      }
    }

    // Update password if provided
    if (password) {
      const { error: passwordError } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (passwordError) {
        console.error('Password update error:', passwordError);
        throw new Error(`Failed to update password: ${passwordError.message}`);
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in edit-staff function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
