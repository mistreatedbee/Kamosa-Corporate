import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Public careers listing — open postings only, enforced twice: the RLS policy on job_postings
// already restricts anon/authenticated SELECT to status = 'open', and this endpoint filters again
// explicitly so the intent is obvious from the code, not just the migration.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return res.status(500).json({ status: 'error', message: 'Server is not configured' });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('job_postings')
    .select('id, title, department, location, employment_type, summary, requirements, responsibilities, closing_date, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ status: 'error', message: 'Failed to load job postings' });
  }

  return res.status(200).json({ postings: data ?? [] });
}
