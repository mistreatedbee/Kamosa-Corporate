import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

// Combines the public careers listing (GET /api/careers) and the application submission
// (POST /api/careers/apply) into a single Vercel function. Vercel's Hobby plan caps a deployment
// at 12 serverless functions — these two were previously separate files, split back out here would
// blow that budget alongside the admin job-postings endpoints. Behaviour is unchanged from before;
// only the routing is combined.

const RATE_LIMIT_PER_HOUR = 3;
const MIN_SUBMISSION_MS = 2000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface ApplyRequestBody {
  jobPostingId?: string;
  name?: string;
  email?: string;
  phone?: string;
  coverMessage?: string;
  cvStoragePath?: string;
  cvFileName?: string;
  website?: string; // honeypot
  formRenderedAt?: number;
}

function getAnonClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0].trim();
  return ip || req.socket?.remoteAddress || 'unknown';
}

function isHoneypotTripped(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}

// GET /api/careers — open postings only, enforced twice: the RLS policy on job_postings already
// restricts anon/authenticated SELECT to status = 'open', and this filters again explicitly so
// the intent is obvious from the code, not just the migration.
async function listPostings(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  let supabase;
  try {
    supabase = getAnonClient();
  } catch {
    return res.status(500).json({ status: 'error', message: 'Server is not configured' });
  }

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

// POST /api/careers/apply — the CV file itself is already in Supabase Storage by the time this
// runs (the client uploads directly to the cv-uploads bucket with the anon key — see
// src/utils/careers.ts) — this just validates the submission and records it against a posting.
// Same anti-spam and rate-limit posture as api/enquiry.ts.
//
// This function uses the service role, so RLS wouldn't stop it from inserting against a
// draft/closed posting — the "posting must be open" check below is what actually enforces that,
// mirroring the DB-level insert policy on job_applications that protects every OTHER caller.
async function submitApplication(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  let body: ApplyRequestBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ status: 'error', message: 'Invalid request body.' });
  }

  if (isHoneypotTripped(body?.website)) {
    return res.status(200).json({ status: 'sent' });
  }

  if (typeof body?.formRenderedAt === 'number') {
    const elapsed = Date.now() - body.formRenderedAt;
    if (elapsed >= 0 && elapsed < MIN_SUBMISSION_MS) {
      return res.status(200).json({ status: 'sent' });
    }
  }

  const jobPostingId = String(body?.jobPostingId ?? '');
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const phone = String(body?.phone ?? '').trim();
  const coverMessage = String(body?.coverMessage ?? '').trim();
  const cvStoragePath = String(body?.cvStoragePath ?? '');
  const cvFileName = String(body?.cvFileName ?? '').trim();

  if (!UUID_RE.test(jobPostingId)) {
    return res.status(400).json({ status: 'error', message: 'Invalid job posting.' });
  }
  if (!name) {
    return res.status(400).json({ status: 'error', message: 'Please check the form and try again.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Please check the form and try again.' });
  }
  if (!cvStoragePath || !cvFileName || !cvStoragePath.startsWith(`${jobPostingId}/`)) {
    return res.status(400).json({ status: 'error', message: 'Please attach your CV and try again.' });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return res
      .status(500)
      .json({ status: 'error', message: 'We could not submit your application. Please try again or contact us directly.' });
  }

  const { data: posting, error: postingError } = await supabase
    .from('job_postings')
    .select('id, title, status')
    .eq('id', jobPostingId)
    .single();

  if (postingError || !posting || posting.status !== 'open') {
    return res.status(400).json({ status: 'error', message: 'This role is no longer accepting applications.' });
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('job_applications')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo);

  if (!countError && (count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return res
      .status(429)
      .json({ status: 'error', message: 'Too many applications submitted recently. Please try again later.' });
  }

  const { error: insertError } = await supabase.from('job_applications').insert({
    job_posting_id: jobPostingId,
    status: 'New',
    name,
    email,
    phone: phone || null,
    cover_message: coverMessage || null,
    cv_storage_path: cvStoragePath,
    cv_file_name: cvFileName,
    ip_hash: ipHash
  });

  if (insertError) {
    return res
      .status(500)
      .json({ status: 'error', message: 'We could not submit your application. Please try again or contact us directly.' });
  }

  return res.status(200).json({ status: 'sent' });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.action;
  const segments = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (segments.length === 0) {
    return listPostings(req, res);
  }
  if (segments.length === 1 && segments[0] === 'apply') {
    return submitApplication(req, res);
  }
  return res.status(404).json({ status: 'error', message: 'Not found.' });
}
