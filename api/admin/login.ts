import type { VercelRequest, VercelResponse } from '@vercel/node';
import { mintSessionCookie, verifyAdminKey } from '../_lib/adminSession';

// STOPGAP per docs/SECURITY_ARCHITECTURE.md Finding 1.1 — see api/_lib/adminSession.ts header
// comment. This endpoint is the ONLY place the raw ADMIN_API_KEY is ever checked; every other
// /api/admin/* endpoint checks the resulting session cookie instead.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body: { key?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!verifyAdminKey(String(body?.key ?? ''))) {
    // Logged (not just returned) per Finding 1.1: "a burst of failed attempts is a
    // credential-stuffing signal on the one secret" worth having in Vercel's function logs.
    console.warn('[admin] failed login attempt');
    return res.status(401).json({ error: 'Invalid key' });
  }

  res.setHeader('Set-Cookie', mintSessionCookie());
  return res.status(200).json({ ok: true });
}
