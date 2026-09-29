import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../../../_lib/adminSession.js';

// Internal staff notes on an enquiry — never visible to the public (enquiry_notes has no public
// SELECT/INSERT policy; this endpoint, via the service role behind the session guard, is the only
// way notes are ever read or written). Same auth-first pattern as every other /api/admin/* route.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  const id = typeof req.query.id === 'string' ? req.query.id : undefined;
  if (!id) {
    return res.status(400).json({ error: 'Missing enquiry id' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured' });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('enquiry_notes')
      .select('id, note, created_at')
      .eq('enquiry_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to load notes' });
    }
    return res.status(200).json({ notes: data ?? [] });
  }

  if (req.method === 'POST') {
    let body: { note?: string };
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const note = body?.note?.trim();
    if (!note) {
      return res.status(400).json({ error: 'note is required' });
    }

    const { data, error } = await supabase
      .from('enquiry_notes')
      .insert({ enquiry_id: id, note })
      .select('id, note, created_at')
      .single();

    if (error || !data) {
      return res.status(500).json({ error: 'Failed to save note' });
    }
    return res.status(200).json(data);
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
