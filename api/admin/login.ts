import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { TOTP, Secret } from 'otpauth';
import {
  mintSessionCookie,
  verifyAdminKey,
  mintMfaPendingCookie,
  clearMfaPendingCookie,
  readMfaPendingCookie
} from '../_lib/adminSession.js';

// STOPGAP per docs/SECURITY_ARCHITECTURE.md Finding 1.1 — see api/_lib/adminSession.ts header
// comment. This endpoint is the ONLY place the raw ADMIN_API_KEY is ever checked; every other
// /api/admin/* endpoint checks the resulting session cookie instead.
//
// Two-step when MFA is enabled, both hitting this same endpoint:
//   1. POST { key } — key verified; if MFA is off, session cookie issued immediately (unchanged
//      behavior). If MFA is on, an mfa_pending cookie is issued instead (proves the key was right,
//      grants nothing else) and the response tells the client to ask for a TOTP code.
//   2. POST { totpCode } — requires a valid, not-expired, under-attempt-limit mfa_pending cookie.
//      A correct code clears it and issues the real session cookie; a wrong one just increments the
//      signed attempt counter and re-issues the pending cookie, so attempts are capped server-side
//      regardless of what the client sends.

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

async function getMfaSecret(): Promise<string | null> {
  const supabase = getServiceClient();
  const { data } = await supabase.from('site_settings').select('value').eq('key', 'admin_mfa_secret').maybeSingle();
  return data?.value ?? null;
}

function verifyTotpCode(secretBase32: string, code: string): boolean {
  const totp = new TOTP({ secret: Secret.fromBase32(secretBase32), digits: 6, period: 30 });
  // window: 1 tolerates one 30s step of clock drift either side — standard TOTP practice.
  return totp.validate({ token: code, window: 1 }) !== null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body: { key?: string; totpCode?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // Step 2: completing a pending MFA challenge.
  if (body?.totpCode !== undefined) {
    const attempts = readMfaPendingCookie(req);
    if (attempts === null) {
      return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
    }

    let secret: string | null;
    try {
      secret = await getMfaSecret();
    } catch {
      return res.status(500).json({ error: 'Server is not configured' });
    }

    if (!secret || !verifyTotpCode(secret, String(body.totpCode).trim())) {
      console.warn('[admin] failed MFA attempt');
      res.setHeader('Set-Cookie', mintMfaPendingCookie(attempts + 1));
      return res.status(401).json({ error: 'Invalid code' });
    }

    res.setHeader('Set-Cookie', [clearMfaPendingCookie(), mintSessionCookie()]);
    return res.status(200).json({ ok: true });
  }

  // Step 1: the admin key.
  if (!verifyAdminKey(String(body?.key ?? ''))) {
    // Logged (not just returned) per Finding 1.1: "a burst of failed attempts is a
    // credential-stuffing signal on the one secret" worth having in Vercel's function logs.
    console.warn('[admin] failed login attempt');
    return res.status(401).json({ error: 'Invalid key' });
  }

  let secret: string | null;
  try {
    secret = await getMfaSecret();
  } catch {
    // Misconfiguration shouldn't lock out the only admin login path if MFA isn't even in use —
    // fail open to "MFA off" only when the lookup itself breaks, never when a secret exists.
    secret = null;
  }

  if (!secret) {
    res.setHeader('Set-Cookie', mintSessionCookie());
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Set-Cookie', mintMfaPendingCookie(0));
  return res.status(200).json({ ok: true, mfaRequired: true });
}
