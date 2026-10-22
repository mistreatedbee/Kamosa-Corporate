import { describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Lives outside api/ on purpose: every .ts file under api/ becomes a Vercel serverless function.

const createClient = vi.fn();
vi.mock('@supabase/supabase-js', () => ({ createClient: (...args: unknown[]) => createClient(...args) }));

const { default: handler, buildUpdate, sanitizeSearch } = await import('../api/admin/enquiries');

function mockResponse() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    }
  };
  return res;
}

describe('api/admin/enquiries authorisation', () => {
  it.each([
    ['GET', {}],
    ['GET', { export: '1', includeNotes: '1' }],
    ['GET', { id: '11111111-1111-4111-8111-111111111111' }],
    ['PATCH', { id: '11111111-1111-4111-8111-111111111111' }],
    ['POST', { id: '11111111-1111-4111-8111-111111111111', notes: '1' }]
  ])('rejects %s %o without a valid session — before touching Supabase', async (method, query) => {
    process.env.ADMIN_SESSION_SECRET = 'test-secret';
    const res = mockResponse();
    await handler(
      { method, query, headers: { cookie: 'kamosa_admin_session=9999999999999.forged' }, body: { status: 'Converted', note: 'x' } } as unknown as VercelRequest,
      res as unknown as VercelResponse
    );
    expect(res.statusCode).toBe(401);
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('buildUpdate (server-side validation)', () => {
  it('accepts every existing status and rejects anything else', () => {
    for (const status of ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Closed', 'Spam']) {
      expect(buildUpdate({ status })).toEqual({ status });
    }
    expect(typeof buildUpdate({ status: 'Won' })).toBe('string');
    expect(typeof buildUpdate({ status: 'in progress' })).toBe('string');
  });

  it('validates and normalises contact fields', () => {
    expect(buildUpdate({ name: '  Ash  ', email: 'workatpaaq@gmail.com', phone: '', company_name: '  ' })).toEqual({
      name: 'Ash',
      email: 'workatpaaq@gmail.com',
      phone: null,
      company_name: null
    });
    expect(typeof buildUpdate({ name: '' })).toBe('string');
    expect(typeof buildUpdate({ email: 'not-an-email' })).toBe('string');
    expect(typeof buildUpdate({ phone: '<script>' })).toBe('string');
  });

  it('accepts real calendar dates (or null) for follow-up fields only', () => {
    expect(buildUpdate({ next_follow_up_at: '2026-10-25', last_contacted_at: null })).toEqual({
      next_follow_up_at: '2026-10-25',
      last_contacted_at: null
    });
    expect(typeof buildUpdate({ next_follow_up_at: '2026-02-30' })).toBe('string');
    expect(typeof buildUpdate({ next_follow_up_at: '25/10/2026' })).toBe('string');
  });

  it('ignores fields that may not be edited (message, type, created_at …)', () => {
    expect(buildUpdate({ message: 'overwrite', type: 'general', created_at: '2020-01-01' })).toBe('Nothing to update');
  });
});

describe('sanitizeSearch', () => {
  it('removes characters that could break out of the PostgREST or() filter', () => {
    expect(sanitizeSearch('a,b)or(id.eq.1')).toBe('a b or id.eq.1');
    expect(sanitizeSearch('100%_match*')).toBe('100 match');
    expect(sanitizeSearch('  NextWave  ')).toBe('NextWave');
  });
});
