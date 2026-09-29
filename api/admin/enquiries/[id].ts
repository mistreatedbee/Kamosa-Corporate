import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../../_lib/adminSession.js';

// Status update for a single enquiry — the smallest step from "leads are visible" to "leads are
// worked." Per the CTO's guardrails: writes go through the exact same session guard as the
// read-only inbox, and enquiries/enquiry_notes keep NO public SELECT/UPDATE policy — this endpoint
// is the only write path, via the service role, gated by rejectIfUnauthorized before Supabase is
// ever touched (same pattern as api/admin/enquiries.ts).

const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Closed', 'Spam'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : undefined;
  if (!id) {
    return res.status(400).json({ error: 'Missing enquiry id' });
  }

  let body: { status?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured' });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('enquiries')
    .update({ status: body.status })
    .eq('id', id)
    .select('id, status')
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Enquiry not found or update failed' });
  }

  return res.status(200).json({ id: data.id, status: data.status });
}
