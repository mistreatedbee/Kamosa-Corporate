import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../../_lib/adminSession.js';

// Update (including status/open-closed toggle) or delete a single job posting. Same guard pattern
// as api/admin/enquiries/[id].ts.

const VALID_EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const VALID_STATUSES = ['draft', 'open', 'closed'];

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function toLines(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  const id = typeof req.query.id === 'string' ? req.query.id : undefined;
  if (!id) {
    return res.status(400).json({ error: 'Missing job posting id' });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  if (req.method === 'PATCH') {
    let body: Record<string, unknown>;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const updates: Record<string, unknown> = {};
    if (body?.title !== undefined) updates.title = String(body.title).trim();
    if (body?.department !== undefined) updates.department = body.department ? String(body.department).trim() : null;
    if (body?.location !== undefined) updates.location = String(body.location).trim();
    if (body?.summary !== undefined) updates.summary = String(body.summary).trim();
    if (body?.closingDate !== undefined) updates.closing_date = body.closingDate ? String(body.closingDate) : null;

    if (body?.employmentType !== undefined) {
      if (!VALID_EMPLOYMENT_TYPES.includes(String(body.employmentType))) {
        return res.status(400).json({ error: `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}` });
      }
      updates.employment_type = body.employmentType;
    }

    if (body?.status !== undefined) {
      if (!VALID_STATUSES.includes(String(body.status))) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      updates.status = body.status;
    }

    const requirements = toLines(body?.requirements);
    if (requirements !== undefined) updates.requirements = requirements;
    const responsibilities = toLines(body?.responsibilities);
    if (responsibilities !== undefined) updates.responsibilities = responsibilities;

    const { data, error } = await supabase.from('job_postings').update(updates).eq('id', id).select().single();

    if (error || !data) {
      return res.status(404).json({ error: 'Job posting not found or update failed' });
    }

    return res.status(200).json({ posting: data });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('job_postings').delete().eq('id', id);
    if (error) {
      return res.status(500).json({ error: 'Failed to delete job posting' });
    }
    return res.status(200).json({ id });
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
