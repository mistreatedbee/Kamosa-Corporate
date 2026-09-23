import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// STOPGAP admin auth per docs/SECURITY_ARCHITECTURE.md Finding 1.1. This is explicitly temporary —
// remove and replace with real Supabase Auth + profiles.role verification the moment Phase 3 ships.
// Do not extend this pattern (e.g. adding roles/permissions to it) — that's a sign real auth is
// overdue, not a reason to grow this file.
//
// Design: the admin enters ADMIN_API_KEY once at /admin/login (never stored client-side). The login
// endpoint verifies it server-side and mints a signed, HttpOnly, Secure, SameSite=Strict cookie
// containing only an expiry timestamp + HMAC signature — an opaque token, not the key itself, and
// never readable by client JS. Every subsequent /api/admin/* request verifies that cookie's
// signature and expiry server-side before touching Supabase at all.

const COOKIE_NAME = 'kamosa_admin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured');
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

export function mintSessionCookie(): string {
  const expiry = Date.now() + SESSION_DURATION_MS;
  const payload = String(expiry);
  const signature = sign(payload);
  const token = `${payload}.${signature}`;
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=0`;
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    })
  );
}

/**
 * Verifies the admin session cookie. Returns true only if present, correctly signed, and not
 * expired. Constant-time comparison on the signature to avoid a timing side-channel.
 */
export function hasValidAdminSession(req: VercelRequest): boolean {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  if (!timingSafeEqual(expectedBuf, actualBuf)) return false;

  const expiry = Number(payload);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;

  return true;
}

/**
 * Verifies the raw admin key (used only by the login endpoint, never by data endpoints).
 * Constant-time comparison to avoid a timing side-channel on the key itself.
 */
export function verifyAdminKey(candidate: string): boolean {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected || !candidate) return false;
  const expectedBuf = Buffer.from(expected);
  const candidateBuf = Buffer.from(candidate);
  if (expectedBuf.length !== candidateBuf.length) return false;
  return timingSafeEqual(expectedBuf, candidateBuf);
}

/**
 * Guard for every /api/admin/* DATA endpoint (not the login endpoint itself). Returns true and
 * sends 401 if the session is invalid/missing — caller should `return` immediately when this
 * returns true, before instantiating any Supabase client. Every admin endpoint MUST call this
 * first, per docs/SECURITY_ARCHITECTURE.md Finding 1.1 — the service role key must never even be
 * instantiated on a request that fails this check.
 */
export function rejectIfUnauthorized(req: VercelRequest, res: VercelResponse): boolean {
  if (!hasValidAdminSession(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return true;
  }
  return false;
}
