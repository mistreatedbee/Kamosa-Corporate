import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { notifyByEmail } from './_lib/notifyEmail.js';

// Lighter sibling of api/enquiry.ts and api/quote-request.ts — same security posture (insert-only
// RLS, service role server-side only, honeypot + timing check, per-IP rate limiting, hashed IPs).

const RATE_LIMIT_PER_HOUR = 5;
const MIN_SUBMISSION_MS = 2000;

interface ServiceRequestBody {
  name: string;
  email: string;
  phone: string;
  serviceSlug: string;
  description: string;
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

function validate(body: ServiceRequestBody): string | null {
  if (!body.name?.trim()) return 'Name is required.';
  if (!body.email?.trim() || !EMAIL_RE.test(body.email.trim())) return 'A valid email is required.';
  if (body.phone?.trim() && !PHONE_RE.test(body.phone.trim())) return 'Phone number is not valid.';
  if (!body.serviceSlug?.trim()) return 'Please select the service you require.';
  if (!body.description?.trim() || body.description.trim().length < 10) {
    return 'Please provide a short description of your requirement.';
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  let body: ServiceRequestBody;
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

  const { data: enquiry, error: insertError } = await supabase
    .from('enquiries')
    .insert({
      type: 'service_request',
      status: 'New',
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      message: body.description.trim(),
      service_slug: body.serviceSlug.trim(),
      source: 'request_service',
      ip_hash: ipHash
    })
    .select('id')
    .single();

  if (insertError || !enquiry) {
    return res.status(500).json({ status: 'error', message: 'We could not submit your request. Please try again or contact us directly.' });
  }

  const { error: detailError } = await supabase.from('service_requests').insert({
    enquiry_id: enquiry.id,
    service_slug: body.serviceSlug.trim(),
    urgency: 'standard'
  });
  void detailError; // Non-fatal — see api/quote-request.ts for the same reasoning.

  await notifyByEmail({
    subject: 'New Service Request',
    lines: [
      { label: 'Name', value: body.name.trim() },
      { label: 'Email', value: body.email.trim() },
      { label: 'Phone', value: body.phone?.trim() || '—' },
      { label: 'Service', value: body.serviceSlug.trim() },
      { label: 'Description', value: body.description.trim() }
    ]
  });

  return res.status(200).json({ status: 'sent' });
}
