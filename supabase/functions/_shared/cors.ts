// Allowed origins for CORS  
const ALLOWED_ORIGINS: string[] = [
  'https://service-flow-track.lovable.app',
  'https://id-preview--864433e8-d589-4ed0-970a-3a9a457f4162.lovable.app',
  'https://864433e8-d589-4ed0-970a-3a9a457f4162.lovableproject.com',
  'http://localhost:8080',
  'http://localhost:5173',
];

// Get CORS headers with origin validation
export const getCorsHeaders = (origin: string | null): Record<string, string> => ({
  'Access-Control-Allow-Origin': (origin && ALLOWED_ORIGINS.includes(origin)) 
    ? origin 
    : ALLOWED_ORIGINS[0]!,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
});

// Legacy export for backward compatibility (use getCorsHeaders instead)
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};
