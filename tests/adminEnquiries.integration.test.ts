import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// End-to-end test of api/admin/enquiries.ts against a REAL PostgREST + Postgres with the project's
// migrations applied (e.g. a local Supabase stack or a throwaway branch). Opt-in only:
//
//   ENQUIRIES_IT_URL=http://localhost:54321 ENQUIRIES_IT_SERVICE_KEY=<service-role key> npm test
//
// It creates a few clearly-labelled temporary enquiries and deletes them afterwards, and restores
// any existing record it touches. NEVER point it at the production project.
// Works both before and after migration 0005 (it checks followUpEnabled and adapts).

const URL_ = process.env.ENQUIRIES_IT_URL;
const KEY = process.env.ENQUIRIES_IT_SERVICE_KEY;
const run = Boolean(URL_ && KEY);

const TAG = 'IT-TEMP';

describe.skipIf(!run)('api/admin/enquiries against a real database', () => {
  let handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown>;
  let cookie: string;
  const db = run ? createClient(URL_ as string, KEY as string, { auth: { persistSession: false } }) : (null as never);
  const startedAt = new Date().toISOString();
  const tempIds: string[] = [];
  let before: { total: number; snapshot: Record<string, unknown>[] };

  async function call(method: string, query: Record<string, string | string[]>, body?: unknown, withCookie = true) {
    const res = {
      statusCode: 0,
      body: undefined as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      status(code: number) {
        res.statusCode = code;
        return res;
      },
      json(payload: unknown) {
        res.body = payload;
        return res;
      },
      setHeader() {
        return res;
      }
    };
    await handler({ method, query, body, headers: withCookie ? { cookie } : {} } as unknown as VercelRequest, res as unknown as VercelResponse);
    return res;
  }

  beforeAll(async () => {
    process.env.VITE_SUPABASE_URL = URL_;
    process.env.SUPABASE_SERVICE_ROLE_KEY = KEY;
    process.env.ADMIN_SESSION_SECRET = 'integration-test-secret';
    const session = await import('../api/_lib/adminSession');
    cookie = session.mintSessionCookie().split(';')[0];
    handler = (await import('../api/admin/enquiries')).default;

    const { data } = await db.from('enquiries').select('*').order('id');
    before = { total: data?.length ?? 0, snapshot: data ?? [] };

    const rows = [
      // 23:30 SAST on 16 Oct = 21:30 UTC — must count as the 16th in SAST date filters.
      { type: 'general', status: 'New', name: `${TAG} Late Night`, email: 'late@example.test', phone: null, company_name: null, message: 'Hello, comma, "quotes"\nand a new line', service_slug: 'General Enquiry', source: 'contact_form', created_at: '2026-10-16T21:30:00Z' },
      { type: 'service_request', status: 'Converted', name: `${TAG} Converted Co`, email: 'won@example.test', phone: '+27 11 000 0000', company_name: 'Won Ltd', message: 'Need environmental support', service_slug: 'environmental', source: 'request_service', created_at: '2026-09-01T08:00:00Z' },
      { type: 'quote_training', status: 'New', name: `${TAG} Trainee`, email: 'trainee@example.test', phone: null, company_name: 'Learn Inc', message: 'Quote request via /request-a-quote for training-skills-development.', service_slug: 'training-skills-development', source: 'request_a_quote', created_at: '2026-10-10T08:00:00Z' }
    ];
    const { data: inserted, error } = await db.from('enquiries').insert(rows).select('id, name');
    if (error) throw error;
    tempIds.push(...(inserted ?? []).map((r) => r.id as string));
  });

  afterAll(async () => {
    if (!run) return;
    if (tempIds.length) await db.from('enquiries').delete().in('id', tempIds);
    // Restore every pre-existing record exactly (status, contact fields, follow-up) and remove notes
    // this test added to them.
    for (const row of before.snapshot) {
      const { id, updated_at: _u, created_at: _c, ...rest } = row as Record<string, unknown>;
      void _u;
      void _c;
      await db.from('enquiries').update(rest).eq('id', id as string);
    }
    await db.from('enquiry_notes').delete().gte('created_at', startedAt);
  });

  it('rejects requests without a session', async () => {
    expect((await call('GET', {}, undefined, false)).statusCode).toBe(401);
    expect((await call('PATCH', { id: tempIds[0] }, { status: 'Spam' }, false)).statusCode).toBe(401);
  });

  it('lists from the database with KPI counts that match the records', async () => {
    const res = await call('GET', { pageSize: '100' });
    expect(res.statusCode).toBe(200);
    const { data: all } = await db.from('enquiries').select('status');
    expect(res.body.total).toBe(all?.length);
    expect(res.body.stats.total).toBe(all?.length);
    expect(res.body.stats.total).toBe(before.total + 3);
    const sum = Object.values(res.body.stats.byStatus as Record<string, number>).reduce((a, b) => a + b, 0) + res.body.stats.other;
    expect(sum).toBe(res.body.stats.total);
    for (const status of ['New', 'In Progress', 'Converted']) {
      expect(res.body.stats.byStatus[status]).toBe(all?.filter((r) => r.status === status).length);
    }
    // Newest first by default; ip_hash is never exposed.
    const times = (res.body.enquiries as { created_at: string }[]).map((e) => Date.parse(e.created_at));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(res.body.enquiries[0]).not.toHaveProperty('ip_hash');
  });

  it('searches name, email, company, phone and message', async () => {
    const find = async (q: string) => ((await call('GET', { q })).body.enquiries as { name: string }[]).map((e) => e.name);
    expect(await find('late night')).toContain(`${TAG} Late Night`);
    expect(await find('WON@EXAMPLE')).toContain(`${TAG} Converted Co`);
    expect(await find('learn inc')).toContain(`${TAG} Trainee`);
    expect(await find('environmental support')).toContain(`${TAG} Converted Co`);
    expect(await find('+27 11 000')).toContain(`${TAG} Converted Co`);
    // Characters that would break the filter syntax are handled, not a 500.
    const nasty = await call('GET', { q: 'a,b)or(id.eq.1%_*"\\' });
    expect(nasty.statusCode).toBe(200);
  });

  it('combines status, type, service and date filters (SAST days)', async () => {
    const names = async (query: Record<string, string | string[]>) => ((await call('GET', query)).body.enquiries as { name: string }[]).map((e) => e.name);
    expect(await names({ status: 'New', type: 'quote_training', from: '2026-10-01', to: '2026-10-31' })).toEqual([`${TAG} Trainee`]);
    expect(await names({ service: ['general', 'General Enquiry'], from: '2026-10-16', to: '2026-10-16' })).toEqual([`${TAG} Late Night`]);
    expect(await names({ service: ['general', 'General Enquiry'], from: '2026-10-17' })).not.toContain(`${TAG} Late Night`);
    expect(await names({ status: 'Contacted,Qualified', type: 'service_request' })).toEqual([]);
    // A contact-form label containing a comma still matches exactly.
    await db.from('enquiries').update({ service_slug: 'Health, Safety & Compliance' }).eq('id', tempIds[0]);
    expect(await names({ service: ['health-safety-compliance', 'Health, Safety & Compliance'], q: TAG })).toEqual([`${TAG} Late Night`]);
    await db.from('enquiries').update({ service_slug: 'General Enquiry' }).eq('id', tempIds[0]);
    expect(await names({ status: 'NotAStatus', q: TAG })).toHaveLength(3); // invalid values are ignored, not "match nothing"
  });

  it('sorts oldest first and paginates server-side', async () => {
    const oldest = await call('GET', { q: TAG, sort: 'oldest' });
    expect((oldest.body.enquiries as { name: string }[]).map((e) => e.name)).toEqual([`${TAG} Converted Co`, `${TAG} Trainee`, `${TAG} Late Night`]);
    const page2 = await call('GET', { q: TAG, pageSize: '1', page: '2' });
    expect(page2.body.total).toBe(3);
    expect(page2.body.enquiries).toHaveLength(1);
    expect(page2.body.enquiries[0].name).toBe(`${TAG} Trainee`);
    const beyond = await call('GET', { q: TAG, pageSize: '1', page: '9' });
    expect(beyond.statusCode).toBe(200);
    expect(beyond.body.enquiries).toEqual([]);
  });

  it('opens one enquiry with its submitted details and notes', async () => {
    const [id] = tempIds;
    const res = await call('GET', { id });
    expect(res.statusCode).toBe(200);
    expect(res.body.enquiry.message).toBe('Hello, comma, "quotes"\nand a new line');
    expect(res.body.enquiry).not.toHaveProperty('ip_hash');
    expect(Array.isArray(res.body.notes)).toBe(true);
    expect((await call('GET', { id: '00000000-0000-4000-8000-000000000000' })).statusCode).toBe(404);
    expect((await call('GET', { id: 'not-a-uuid' })).statusCode).toBe(400);
  });

  it('persists a status change, bumps updated_at and records history', async () => {
    const id = tempIds[2];
    const { data: prior } = await db.from('enquiries').select('updated_at').eq('id', id).single();
    const res = await call('PATCH', { id }, { status: 'Qualified' });
    expect(res.statusCode).toBe(200);
    expect(res.body.enquiry.status).toBe('Qualified');
    const { data: row } = await db.from('enquiries').select('status, updated_at, message').eq('id', id).single();
    expect(row?.status).toBe('Qualified');
    expect(Date.parse(row?.updated_at)).toBeGreaterThan(Date.parse(prior?.updated_at));
    expect(row?.message).toBe('Quote request via /request-a-quote for training-skills-development.');
    const detail = await call('GET', { id });
    expect((detail.body.notes as { note: string }[]).some((n) => n.note === 'Status changed from New to Qualified')).toBe(true);
    // Sorting by recently updated now puts it first among the temp rows.
    const updated = await call('GET', { q: TAG, sort: 'updated' });
    expect(updated.body.enquiries[0].id).toBe(id);
  });

  it('rejects invalid updates and leaves the record untouched', async () => {
    const id = tempIds[2];
    expect((await call('PATCH', { id }, { status: 'Won' })).statusCode).toBe(400);
    expect((await call('PATCH', { id }, { email: 'nope' })).statusCode).toBe(400);
    expect((await call('PATCH', { id }, { message: 'overwritten' })).statusCode).toBe(400);
    const { data: row } = await db.from('enquiries').select('status, email, message').eq('id', id).single();
    expect(row).toEqual({ status: 'Qualified', email: 'trainee@example.test', message: 'Quote request via /request-a-quote for training-skills-development.' });
    expect((await call('PATCH', { id: '00000000-0000-4000-8000-000000000000' }, { status: 'New' })).statusCode).toBe(404);
  });

  it('adds internal notes and reads them back', async () => {
    const id = tempIds[0];
    const added = await call('POST', { id, notes: '1' }, { note: 'Client contacted.' });
    expect(added.statusCode).toBe(201);
    expect(added.body.note.note).toBe('Client contacted.');
    expect((await call('POST', { id, notes: '1' }, { note: '   ' })).statusCode).toBe(400);
    const detail = await call('GET', { id });
    expect(detail.body.notes[0].note).toBe('Client contacted.');
  });

  it('exports every matching record, with internal notes only on request', async () => {
    const filtered = await call('GET', { export: '1', q: TAG });
    expect(filtered.statusCode).toBe(200);
    expect(filtered.body.enquiries).toHaveLength(3);
    expect(filtered.body.notes).toBeUndefined();
    const all = await call('GET', { export: '1' });
    expect(all.body.enquiries).toHaveLength(before.total + 3);
    const withNotes = await call('GET', { export: '1', q: TAG, includeNotes: '1' });
    expect((withNotes.body.notes as { note: string }[]).some((n) => n.note === 'Client contacted.')).toBe(true);
    const none = await call('GET', { export: '1', q: 'zzz-no-such-enquiry' });
    expect(none.body.enquiries).toEqual([]);
  });

  it('tracks follow-ups when migration 0005 is applied (409 otherwise)', async () => {
    const [openId, convertedId] = [tempIds[0], tempIds[1]];
    const res = await call('PATCH', { id: openId }, { next_follow_up_at: '2026-01-02', last_contacted_at: '2026-01-01' });
    const list = await call('GET', {});
    if (!list.body.followUpEnabled) {
      expect(res.statusCode).toBe(409);
      expect(list.body.stats.followUpDue).toBeNull();
      return;
    }
    expect(res.statusCode).toBe(200);
    expect(res.body.enquiry.next_follow_up_at).toBe('2026-01-02');
    await call('PATCH', { id: convertedId }, { next_follow_up_at: '2026-01-02' });
    const due = await call('GET', { followUp: 'due', q: TAG });
    // Converted enquiries never count as needing follow-up.
    expect((due.body.enquiries as { id: string }[]).map((e) => e.id)).toEqual([openId]);
    expect(list.body.stats.followUpDue).toBeGreaterThanOrEqual(1);
    const detail = await call('GET', { id: openId });
    expect((detail.body.notes as { kind?: string; note: string }[]).some((n) => n.kind === 'follow_up' && n.note === 'Next follow-up set to 2 Jan 2026')).toBe(true);
    const sorted = await call('GET', { q: TAG, sort: 'follow_up' });
    expect(sorted.body.enquiries[0].id).toBe(openId);
  });
});
