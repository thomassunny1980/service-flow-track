import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, corsHeaders } from '../_shared/cors.ts';

interface CreateCustomerRequest {
  mobile: string;
  fullName: string;
}

// Generate a secure random password
function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each required character type
  const password: string[] = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password.push(allChars[Math.floor(Math.random() * allChars.length)]);
  }
  
  // Shuffle the password array
  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }
  
  return password.join('');
}

Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers });
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

    // Validate mobile number format (digits only)
    if (!/^[0-9]{10,15}$/.test(mobile)) {
      throw new Error('Mobile number must be 10-15 digits');
    }

    const customerEmail = `${mobile}@customer.local`;

    // Generate a unique secure password for this customer
    const generatedPassword = generateSecurePassword(12);

    // Try to create new customer user
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email: customerEmail,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    // If user already exists, find and return their ID
    if (createError && createError.message?.includes('already registered')) {
      const { data: users } = await supabaseClient.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === customerEmail);
      
      if (existingUser) {
        return new Response(
          JSON.stringify({ customerId: existingUser.id, existed: true }),
          {
            headers: { ...headers, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }

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
      JSON.stringify({ 
        customerId: newUser.user.id, 
        existed: false,
        tempPassword: generatedPassword 
      }),
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
