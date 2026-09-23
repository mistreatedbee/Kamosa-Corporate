import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../_lib/adminSession';

// Read-only admin enquiry inbox — deliberately tight scope per the CTO's directive: no editing,
// no notes, no CRM yet. Just visibility into leads that were previously landing in a table nobody
// read. Newest first, optional type/status filters.
//
// SECURITY (Finding 1.1, non-negotiable): the auth check happens BEFORE the Supabase client is
// instantiated, in every branch. A request that fails the session check never reaches Supabase.

const VALID_TYPES = ['general', 'quote_hs', 'quote_training', 'quote_procurement', 'service_request'];
const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Closed', 'Spam'];
const MAX_LIMIT = 200;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured' });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const typeParam = typeof req.query.type === 'string' ? req.query.type : undefined;
  const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;

  let query = supabase
    .from('enquiries')
    .select('id, type, status, name, email, phone, company_name, message, service_slug, source, created_at')
    .order('created_at', { ascending: false })
    .limit(MAX_LIMIT);

  if (typeParam && VALID_TYPES.includes(typeParam)) {
    query = query.eq('type', typeParam);
  }
  if (statusParam && VALID_STATUSES.includes(statusParam)) {
    query = query.eq('status', statusParam);
  }

  const { data, error } = await query;
  if (error) {
    return res.status(500).json({ error: 'Failed to load enquiries' });
  }

  return res.status(200).json({ enquiries: data ?? [] });
}
