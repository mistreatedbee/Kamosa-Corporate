import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { notifyByEmail } from './_lib/notifyEmail.js';

// Same security posture as api/enquiry.ts: insert-only RLS, service role used server-side only,
// honeypot + timing anti-spam, per-IP rate limiting, hashed IPs. See that file's comments for the
// full rationale — not repeated here.

const RATE_LIMIT_PER_HOUR = 5;
const MIN_SUBMISSION_MS = 2000;

type Category = 'health_safety' | 'training' | 'procurement' | 'other';

interface QuoteRequestBody {
  name: string;
  company: string;
  email: string;
  phone: string;
  category: Category;
  serviceSlug: string;
  details: Record<string, unknown>;
  freeText?: string;
  website?: string;
  formRenderedAt?: number;
}

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase environment variables are not configured');
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
  return typeof value === 'string' && value.trim().length > 0;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\s-]{7,20}$/;

function validate(body: QuoteRequestBody): string | null {
  if (!body.name?.trim()) return 'Name is required.';
  if (!body.email?.trim() || !EMAIL_RE.test(body.email.trim())) return 'A valid email is required.';
  if (body.phone?.trim() && !PHONE_RE.test(body.phone.trim())) return 'Phone number is not valid.';
  if (!body.category) return 'Service selection is required.';
  if (!body.serviceSlug?.trim()) return 'Service selection is required.';

  if (body.category === 'health_safety' && !String(body.details?.site_type || '').trim()) {
    return 'Site/project type is required.';
  }
  if (body.category === 'training') {
    if (!String(body.details?.course || '').trim()) return 'Course of interest is required.';
    if (!String(body.details?.participant_count || '').trim()) return 'Approximate participant count is required.';
  }
  if (body.category === 'procurement') {
    if (!String(body.details?.product_category || '').trim()) return 'Product category is required.';
    if (!String(body.details?.quantity || '').trim()) return 'Approximate quantity is required.';
  }
  if (body.category === 'other' && !body.freeText?.trim()) {
    return 'Please tell us what you are looking to achieve.';
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  let body: QuoteRequestBody;
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

  const validationError = validate(body);
  if (validationError) {
    return res.status(400).json({ status: 'error', message: validationError });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ status: 'error', message: 'We could not submit your request. Please try again or contact us directly.' });
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from('enquiries')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', oneHourAgo);

  if (!countError && (count ?? 0) >= RATE_LIMIT_PER_HOUR) {
    return res.status(429).json({ status: 'error', message: 'Too many requests submitted recently. Please try again later.' });
  }

  // Maps to the exact `enquiries.type` check-constraint values from
  // supabase/migrations/0001_enquiries.sql — 'health_safety' -> 'quote_hs', not 'quote_health_safety'.
  const CATEGORY_TO_ENQUIRY_TYPE: Record<Category, string> = {
    health_safety: 'quote_hs',
    training: 'quote_training',
    procurement: 'quote_procurement',
    other: 'general'
  };
  const enquiryType = CATEGORY_TO_ENQUIRY_TYPE[body.category];

  const message = body.category === 'other'
    ? body.freeText?.trim() || ''
    : `Quote request via /request-a-quote for ${body.serviceSlug}.`;

  const { data: enquiry, error: insertError } = await supabase
    .from('enquiries')
    .insert({
      type: enquiryType,
      status: 'New',
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      company_name: body.company?.trim() || null,
      message,
      service_slug: body.serviceSlug.trim(),
      source: 'request_a_quote',
      ip_hash: ipHash
    })
    .select('id')
    .single();

  if (insertError || !enquiry) {
    return res.status(500).json({ status: 'error', message: 'We could not submit your request. Please try again or contact us directly.' });
  }

  if (body.category !== 'other') {
    const { error: detailError } = await supabase.from('quote_requests').insert({
      enquiry_id: enquiry.id,
      category: body.category,
      details: body.details || {}
    });
    // A failed detail-row insert shouldn't fail the whole request — the lead itself is already
    // saved in `enquiries`; the structured detail is a nice-to-have for admin triage.
    void detailError; // Swallowed intentionally; the enquiry row is the source of truth for "did we get the lead."
  }

  const detailLines = Object.entries(body.details || {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => ({ label: key.replace(/_/g, ' '), value: String(value) }));

  await notifyByEmail({
    subject: 'New Quote Request',
    lines: [
      { label: 'Name', value: body.name.trim() },
      { label: 'Company', value: body.company?.trim() || '—' },
      { label: 'Email', value: body.email.trim() },
      { label: 'Phone', value: body.phone?.trim() || '—' },
      { label: 'Service', value: body.serviceSlug.trim() },
      { label: 'Category', value: body.category },
      ...detailLines,
      ...(body.category === 'other' ? [{ label: 'Details', value: body.freeText?.trim() || '' }] : [])
    ]
  });

  return res.status(200).json({ status: 'sent' });
}
