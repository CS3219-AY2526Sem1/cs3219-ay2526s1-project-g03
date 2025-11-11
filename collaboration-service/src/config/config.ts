export const SUPABASE_URL = process.env['SUPABASE_URL'] as string;
export const SUPABASE_KEY = process.env['SUPABASE_KEY'] as string;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL ERROR: Missing required environment variables');
  console.error('Required: SUPABASE_URL, SUPABASE_KEY');
  console.error('Please check your .env file');
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_KEY');
}

if (!process.env['JWT_SECRET']) {
  console.error('FATAL ERROR: Missing required environment variables');
  console.error('Required: JWT_SECRET');
  console.error('Please check your .env file');
  throw new Error('Missing required environment variables: JWT_SECRET');
}
export const JWT_SECRET = new TextEncoder().encode(process.env['JWT_SECRET']);

