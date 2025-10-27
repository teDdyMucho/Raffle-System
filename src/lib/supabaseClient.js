import { createClient } from '@supabase/supabase-js';

// Create client from env vars. CRA exposes REACT_APP_*
let supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
let supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Fallback to provided values if env is missing (DEV ONLY)
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Missing env vars, falling back to provided dev credentials. Move these into .env.local in production.'
  );
  supabaseUrl = 'https://bndiztrglczuiifwptqp.supabase.co';
  supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuZGl6dHJnbGN6dWlpZndwdHFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjg0MDgsImV4cCI6MjA3MzYwNDQwOH0.qUbryNB9l_fDJ5XGdo1DoDTf2eWoBrYMRt06vsBCxyo';
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
