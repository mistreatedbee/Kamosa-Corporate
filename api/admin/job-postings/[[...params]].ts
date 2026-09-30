import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../../_lib/adminSession.js';

// Combines admin job-posting list/create, single-posting update/delete, and the per-posting
// applications list into one Vercel function via an optional catch-all route:
//   GET/POST   /api/admin/job-postings                     (no params)
//   PATCH/DELETE /api/admin/job-postings/:id                (params = [id])
//   GET        /api/admin/job-postings/:id/applications     (params = [id, 'applications'])
// Vercel's Hobby plan caps a deployment at 12 serverless functions; these were three separate
// files before. Behaviour and payloads are unchanged from before, only the routing is combined.
// The session guard still runs first, before anything else, on every branch.

const VALID_EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const VALID_STATUSES = ['draft', 'open', 'closed'];
const SIGNED_URL_TTL_SECONDS = 300;

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

function toLinesOptional(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  return toLines(value);
}

type ServiceClient = ReturnType<typeof getServiceClient>;

async function listPostings(res: VercelResponse, supabase: ServiceClient) {
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

async function createPosting(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
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

async function updatePosting(id: string, req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
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

  const requirements = toLinesOptional(body?.requirements);
  if (requirements !== undefined) updates.requirements = requirements;
  const responsibilities = toLinesOptional(body?.responsibilities);
  if (responsibilities !== undefined) updates.responsibilities = responsibilities;

  const { data, error } = await supabase.from('job_postings').update(updates).eq('id', id).select().single();

  if (error || !data) {
    return res.status(404).json({ error: 'Job posting not found or update failed' });
  }

  return res.status(200).json({ posting: data });
}

async function deletePosting(id: string, res: VercelResponse, supabase: ServiceClient) {
  const { error } = await supabase.from('job_postings').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: 'Failed to delete job posting' });
  }
  return res.status(200).json({ id });
}

async function listApplications(jobPostingId: string, res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, status, name, email, phone, cover_message, cv_storage_path, cv_file_name, created_at')
    .eq('job_posting_id', jobPostingId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to load applications' });
  }

  const applications = await Promise.all(
    (data ?? []).map(async (application) => {
      const { data: signed } = await supabase.storage
        .from('cv-uploads')
        .createSignedUrl(application.cv_storage_path, SIGNED_URL_TTL_SECONDS);
      return {
        id: application.id,
        status: application.status,
        name: application.name,
        email: application.email,
        phone: application.phone,
        cover_message: application.cover_message,
        cv_file_name: application.cv_file_name,
        created_at: application.created_at,
        cv_url: signed?.signedUrl ?? null
      };
    })
  );

  return res.status(200).json({ applications });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  let supabase: ServiceClient;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const raw = req.query.params;
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (segments.length === 0) {
    if (req.method === 'GET') return listPostings(res, supabase);
    if (req.method === 'POST') return createPosting(req, res, supabase);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (segments.length === 1) {
    const [id] = segments;
    if (req.method === 'PATCH') return updatePosting(id, req, res, supabase);
    if (req.method === 'DELETE') return deletePosting(id, res, supabase);
    res.setHeader('Allow', 'PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (segments.length === 2 && segments[1] === 'applications') {
    const [id] = segments;
    if (req.method === 'GET') return listApplications(id, res, supabase);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(404).json({ error: 'Not found' });
}
