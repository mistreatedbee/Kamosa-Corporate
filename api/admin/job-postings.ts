import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../_lib/adminSession.js';

// Admin job postings — list (all statuses) and create. Same guard pattern as
// api/admin/enquiries.ts: the session check runs before any Supabase client is instantiated.

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

function toLines(value: unknown): string[] {
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

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('job_postings')
      .select(
        'id, title, department, location, employment_type, summary, requirements, responsibilities, status, closing_date, created_at, job_applications(count)'
      )
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to load job postings' });
    }

    const postings = (data ?? []).map((row) => {
      const { job_applications, ...rest } = row as typeof row & { job_applications: { count: number }[] };
      return { ...rest, application_count: job_applications?.[0]?.count ?? 0 };
    });

    return res.status(200).json({ postings });
  }

  if (req.method === 'POST') {
    let body: Record<string, unknown>;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const title = String(body?.title ?? '').trim();
    const summary = String(body?.summary ?? '').trim();
    const employmentType = String(body?.employmentType ?? 'Full-time');
    const status = String(body?.status ?? 'draft');

    if (!title || !summary) {
      return res.status(400).json({ error: 'Title and summary are required' });
    }
    if (!VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
      return res.status(400).json({ error: `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}` });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { data, error } = await supabase
      .from('job_postings')
      .insert({
        title,
        department: body?.department ? String(body.department).trim() : null,
        location: body?.location ? String(body.location).trim() : 'South Africa',
        employment_type: employmentType,
        summary,
        requirements: toLines(body?.requirements),
        responsibilities: toLines(body?.responsibilities),
        status,
        closing_date: body?.closingDate ? String(body.closingDate) : null
      })
      .select()
      .single();

    if (error || !data) {
      return res.status(500).json({ error: 'Failed to create job posting' });
    }

    return res.status(201).json({ posting: data });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
