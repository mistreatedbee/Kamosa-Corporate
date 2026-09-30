import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Used client-side only for the one thing the anon key is allowed to do here: uploading a CV
// straight to the private cv-uploads bucket (see supabase/migrations/0002_careers.sql — the
// storage policy allows INSERT only, never list/read). Everything else in this app talks to
// Supabase through the serverless /api/* functions with the service role, never from the client.
export const supabase = url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;
