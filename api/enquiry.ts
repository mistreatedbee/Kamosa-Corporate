import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { validateEnquiry, type EnquiryPayload } from '../src/utils/enquiry';
import { notifyByEmail } from './_lib/notifyEmail';

// Phase 1 enquiry backend. Writes to Postgres (docs/DECISIONS.md Decision 1) — an email-only lead
// is a lead you can lose. Security posture per docs/SECURITY_ARCHITECTURE.md and
// docs/DECISIONS.md Decision 3:
//   - enquiries table is insert-only for the public role (enforced by RLS, not by this function —
//     this function uses the service role, so RLS wouldn't stop it, but the DB-level policy is
//     what protects the table from any OTHER caller, including a future bug in this file).
//   - the service role key is read from process.env here only, never exposed to the client.
//   - honeypot + submission-timing check per SECURITY_ARCHITECTURE.md Finding 3.3.
//   - per-IP rate limiting per SECURITY_ARCHITECTURE.md Finding 3.2 (5 submissions/IP/hour),
//     implemented as a query against the enquiries table itself rather than adding a new Redis
//     dependency — proportionate to actual traffic at this stage.
//   - raw IP is hashed before storage, never stored raw (minimal PII).

const RATE_LIMIT_PER_HOUR = 5;
const MIN_SUBMISSION_MS = 2000;

interface EnquiryRequestBody extends EnquiryPayload {
  // Anti-spam fields — not business data, stripped before validation/storage.
  website?: string; // honeypot: real users never see or fill this field
  formRenderedAt?: number; // client-supplied timestamp (ms) of when the form was rendered
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  }

  let body: EnquiryRequestBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ status: 'error', message: 'Invalid request body.' });
  }

  // Honeypot: real visitors never populate this field (hidden via CSS, not `type=hidden`, so
  // basic bots that skip hidden inputs still fall for it).
  if (isHoneypotTripped(body?.website)) {
    // Return a generic success-shaped response to avoid teaching bots what tripped the filter.
    return res.status(200).json({ status: 'sent' });
  }

  // Timing check: reject submissions filled in impossibly fast for a human.
  if (typeof body?.formRenderedAt === 'number') {
    const elapsed = Date.now() - body.formRenderedAt;
    if (elapsed >= 0 && elapsed < MIN_SUBMISSION_MS) {
      return res.status(200).json({ status: 'sent' });
    }
  }

  const payload: EnquiryPayload = {
    name: String(body?.name ?? ''),
    company: String(body?.company ?? ''),
    email: String(body?.email ?? ''),
    phone: String(body?.phone ?? ''),
    service: String(body?.service ?? ''),
    message: String(body?.message ?? '')
  };

  const errors = validateEnquiry(payload);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ status: 'error', message: 'Please check the form and try again.' });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    // Misconfiguration (missing env vars), not a visitor-caused error.
    return res
      .status(500)
      .json({ status: 'error', message: 'We could not submit your enquiry. Please try again or contact us directly.' });
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
    return res
      .status(429)
      .json({ status: 'error', message: 'Too many enquiries submitted recently. Please try again later.' });
  }

  const { error: insertError } = await supabase.from('enquiries').insert({
    type: 'general',
    status: 'New',
    name: payload.name.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim() || null,
    company_name: payload.company.trim() || null,
    message: payload.message.trim(),
    service_slug: payload.service.trim() || null,
    source: 'contact_form',
    ip_hash: ipHash
  });

  if (insertError) {
    return res
      .status(500)
      .json({ status: 'error', message: 'We could not submit your enquiry. Please try again or contact us directly.' });
  }

  // No-ops until RESEND_API_KEY is set — see api/_lib/notifyEmail.ts. Never blocks the response;
  // the lead is already durably in Postgres by this point regardless.
  await notifyByEmail({
    subject: 'New Kamosa Website Enquiry',
    lines: [
      { label: 'Name', value: payload.name.trim() },
      { label: 'Company', value: payload.company.trim() || '—' },
      { label: 'Email', value: payload.email.trim() },
      { label: 'Phone', value: payload.phone.trim() || '—' },
      { label: 'Service', value: payload.service.trim() || '—' },
      { label: 'Message', value: payload.message.trim() }
    ]
  });

  return res.status(200).json({ status: 'sent' });
}
