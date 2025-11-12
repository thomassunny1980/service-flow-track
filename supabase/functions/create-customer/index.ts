import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface CreateCustomerRequest {
  mobile: string;
  fullName: string;
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

    // Verify the request is from an authenticated admin or staff user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin or staff
    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdminOrStaff = roles?.some(r => r.role === 'admin' || r.role === 'staff');
    if (!isAdminOrStaff) {
      throw new Error('Only admin or staff can create customer accounts');
    }

    const { mobile, fullName }: CreateCustomerRequest = await req.json();

    if (!mobile || !fullName) {
      throw new Error('Mobile and fullName are required');
    }

    const customerEmail = `${mobile}@customer.local`;

    // Check if customer already exists
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const existing = existingUser?.users.find(u => u.email === customerEmail);

    if (existing) {
      // Customer already exists, return their ID
      return new Response(
        JSON.stringify({ customerId: existing.id, existed: true }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Create new customer user
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email: customerEmail,
      password: '123456',
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

    // Assign customer role
    await supabaseClient.from('user_roles').insert({
      user_id: newUser.user.id,
      role: 'customer',
    });

    // Create profile
    await supabaseClient.from('profiles').insert({
      id: newUser.user.id,
      full_name: fullName,
    });

    return new Response(
      JSON.stringify({ customerId: newUser.user.id, existed: false }),
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
