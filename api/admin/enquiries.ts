import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../_lib/adminSession.js';

// Admin enquiry management — list/search/filter, KPI stats, detail, status + contact + follow-up
// updates, internal notes, and the CSV export data, as ONE flat function dispatched by HTTP method
// plus query string (never path segments — see the careers-routing-fix commit and the comment at
// the top of api/careers.ts for why path-segment routing silently 404'd on Vercel):
//   GET   /api/admin/enquiries?q=&status=&type=&service=&service=&from=&to=&followUp=&sort=&page=&pageSize=
//                                                    filtered page + total + KPI stats
//   GET   /api/admin/enquiries?export=1&<same filters>[&includeNotes=1]
//                                                    every matching row (not just one page)
//   GET   /api/admin/enquiries?id=<id>               one enquiry + submitted details + notes
//   PATCH /api/admin/enquiries?id=<id>               status / contact fields / follow-up dates
//   POST  /api/admin/enquiries?id=<id>&notes=1       add an internal note
//
// This replaces three files (enquiries.ts, enquiries/[id].ts, enquiries/[id]/notes.ts), which
// frees two of Vercel Hobby's 12 serverless-function slots.
//
// SECURITY (Finding 1.1, non-negotiable): the session check happens BEFORE the Supabase client is
// instantiated, on every branch. enquiries/enquiry_notes keep NO public SELECT/UPDATE policy — this
// endpoint, via the service role, is the only read/write path. ip_hash/spam_score are never
// returned. Internal notes are only returned by the detail branch and, when explicitly requested
// with includeNotes=1, by the export branch — never by any public endpoint.
//
// Dates: the business runs on South African time (SAST, UTC+2, no DST), so date-only filters and
// follow-up dates are interpreted in that zone rather than in the server's UTC.

const VALID_TYPES = ['general', 'quote_hs', 'quote_training', 'quote_procurement', 'service_request'];
const VALID_STATUSES = ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Closed', 'Spam'];
// Statuses that no longer need chasing — excluded from "follow-up due".
const CLOSED_STATUSES = ['Converted', 'Closed', 'Spam'];
const VALID_SORTS = ['newest', 'oldest', 'updated', 'follow_up'];
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const EXPORT_CHUNK = 1000;
const EXPORT_MAX_ROWS = 10000;
const ID_CHUNK = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\s.-]{3,40}$/;
const SAST_OFFSET = '+02:00';
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

const BASE_COLUMNS = 'id, type, status, name, email, phone, company_name, message, service_slug, source, created_at, updated_at';
// Added by supabase/migrations/0005_enquiry_follow_up.sql. Until that migration is applied, every
// read falls back to BASE_COLUMNS and reports followUpEnabled: false, so the page keeps working.
const FOLLOW_UP_COLUMNS = 'next_follow_up_at, last_contacted_at';

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

type ServiceClient = ReturnType<typeof getServiceClient>;

interface Filters {
  q: string;
  statuses: string[];
  types: string[];
  services: string[];
  from: string | null;
  to: string | null;
  followUpDue: boolean;
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  // 42703 = Postgres undefined_column; PGRST204 = PostgREST "column not found in schema cache".
  return error.code === '42703' || error.code === 'PGRST204';
}

function queryString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return '';
}

function queryList(value: unknown): string[] {
  const raw = Array.isArray(value) ? value.join(',') : typeof value === 'string' ? value : '';
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

/** Today's calendar date in South Africa, as YYYY-MM-DD. */
function todaySast(): string {
  return new Date(Date.now() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Strips characters that would break out of a PostgREST `or=(...)` filter or act as LIKE wildcards. */
export function sanitizeSearch(raw: string): string {
  return raw
    .slice(0, 100)
    .replace(/[%_*,()"\\:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFilters(query: VercelRequest['query']): Filters {
  const from = queryString(query.from);
  const to = queryString(query.to);
  return {
    q: sanitizeSearch(queryString(query.q)),
    statuses: queryList(query.status).filter((s) => VALID_STATUSES.includes(s)),
    types: queryList(query.type).filter((t) => VALID_TYPES.includes(t)),
    // service_slug holds a slug for quote/service requests and the service LABEL for contact-form
    // enquiries, so the client sends every alias of a service as a REPEATED `service` param (labels
    // can contain commas, e.g. "Health, Safety & Compliance", so this one is never comma-split);
    // values are matched exactly via in().
    services: (Array.isArray(query.service) ? query.service : typeof query.service === 'string' ? [query.service] : [])
      .map((s) => String(s).trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 20),
    from: isValidDate(from) ? from : null,
    to: isValidDate(to) ? to : null,
    followUpDue: queryString(query.followUp) === 'due'
  };
}

function filteredQuery(
  supabase: ServiceClient,
  filters: Filters,
  columns: string,
  options?: { count?: 'exact'; head?: boolean }
) {
  let query = supabase.from('enquiries').select(columns, options);

  if (filters.q) {
    const term = `%${filters.q}%`;
    const clauses = ['name', 'email', 'company_name', 'phone', 'message'].map((column) => `${column}.ilike.${term}`);
    // Phone numbers are stored as typed, so "073 153 1188" should still find "0731531188".
    const digits = filters.q.replace(/[^0-9]/g, '');
    if (digits.length >= 3 && digits !== filters.q) clauses.push(`phone.ilike.%${digits}%`);
    query = query.or(clauses.join(','));
  }
  if (filters.statuses.length > 0) query = query.in('status', filters.statuses);
  if (filters.types.length > 0) query = query.in('type', filters.types);
  if (filters.services.length > 0) query = query.in('service_slug', filters.services);
  if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00${SAST_OFFSET}`);
  if (filters.to) query = query.lt('created_at', `${addDays(filters.to, 1)}T00:00:00${SAST_OFFSET}`);
  if (filters.followUpDue) {
    query = query.lte('next_follow_up_at', todaySast()).not('status', 'in', `(${CLOSED_STATUSES.map((s) => `"${s}"`).join(',')})`);
  }
  return query;
}

function applySort<T extends { order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => T }>(
  query: T,
  sort: string,
  followUpEnabled: boolean
): T {
  switch (sort) {
    case 'oldest':
      return query.order('created_at', { ascending: true }).order('id', { ascending: true });
    case 'updated':
      return query.order('updated_at', { ascending: false }).order('id', { ascending: false });
    case 'follow_up':
      if (followUpEnabled) {
        return query
          .order('next_follow_up_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
      }
      return query.order('created_at', { ascending: false }).order('id', { ascending: false });
    default:
      return query.order('created_at', { ascending: false }).order('id', { ascending: false });
  }
}

async function countWhere(
  supabase: ServiceClient,
  build: (query: ReturnType<typeof filteredQuery>) => ReturnType<typeof filteredQuery>
): Promise<number | null> {
  const empty: Filters = { q: '', statuses: [], types: [], services: [], from: null, to: null, followUpDue: false };
  const { count, error } = await build(filteredQuery(supabase, empty, 'id', { count: 'exact', head: true }));
  if (error) return null;
  return count ?? 0;
}

/** KPI counts across ALL enquiries (independent of the active filters). */
async function loadStats(supabase: ServiceClient, followUpEnabled: boolean) {
  const today = todaySast();
  const [total, byStatusCounts, last7, last30, followUpDue] = await Promise.all([
    countWhere(supabase, (q) => q),
    Promise.all(VALID_STATUSES.map((status) => countWhere(supabase, (q) => q.eq('status', status)))),
    countWhere(supabase, (q) => q.gte('created_at', `${addDays(today, -6)}T00:00:00${SAST_OFFSET}`)),
    countWhere(supabase, (q) => q.gte('created_at', `${addDays(today, -29)}T00:00:00${SAST_OFFSET}`)),
    followUpEnabled
      ? countWhere(supabase, (q) =>
          q.lte('next_follow_up_at', today).not('status', 'in', `(${CLOSED_STATUSES.map((s) => `"${s}"`).join(',')})`)
        )
      : Promise.resolve(null)
  ]);

  if (total === null || byStatusCounts.some((c) => c === null)) return null;

  const byStatus: Record<string, number> = {};
  VALID_STATUSES.forEach((status, index) => {
    byStatus[status] = byStatusCounts[index] ?? 0;
  });
  // Any row whose status isn't one of the known values (shouldn't happen — there's a check
  // constraint — but the total must never silently disagree with the breakdown).
  const known = Object.values(byStatus).reduce((sum, n) => sum + n, 0);
  const other = Math.max(0, total - known);

  return { total, byStatus, other, last7Days: last7, last30Days: last30, followUpDue, today };
}

async function listEnquiries(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  const filters = parseFilters(req.query);
  const sortParam = queryString(req.query.sort);
  const sort = VALID_SORTS.includes(sortParam) ? sortParam : 'newest';
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(queryString(req.query.pageSize)) || DEFAULT_PAGE_SIZE));
  const page = Math.max(1, Math.floor(Number(queryString(req.query.page)) || 1));
  const fromIndex = (page - 1) * pageSize;

  let followUpEnabled = true;
  const run = (columns: string, withFollowUp: boolean) =>
    applySort(
      filteredQuery(supabase, withFollowUp ? filters : { ...filters, followUpDue: false }, columns, { count: 'exact' }),
      sort,
      withFollowUp
    ).range(fromIndex, fromIndex + pageSize - 1);

  let result = await run(`${BASE_COLUMNS}, ${FOLLOW_UP_COLUMNS}`, true);
  if (isMissingColumn(result.error)) {
    followUpEnabled = false;
    result = await run(BASE_COLUMNS, false);
  }

  // PostgREST answers 416 / PGRST103 when the requested page is past the end — treat as empty.
  if (result.error && result.error.code !== 'PGRST103') {
    return res.status(500).json({ error: 'Failed to load enquiries' });
  }

  const stats = await loadStats(supabase, followUpEnabled);
  if (!stats) {
    return res.status(500).json({ error: 'Failed to load enquiry totals' });
  }

  return res.status(200).json({
    enquiries: result.error ? [] : result.data ?? [],
    total: result.error ? 0 : result.count ?? 0,
    page,
    pageSize,
    sort,
    stats,
    followUpEnabled
  });
}

async function fetchInChunks<T>(
  ids: string[],
  load: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[] | null> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const { data, error } = await load(ids.slice(i, i + ID_CHUNK));
    if (error) return null;
    out.push(...(data ?? []));
  }
  return out;
}

async function exportEnquiries(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  const filters = parseFilters(req.query);
  const sortParam = queryString(req.query.sort);
  const sort = VALID_SORTS.includes(sortParam) ? sortParam : 'newest';
  const includeNotes = queryString(req.query.includeNotes) === '1';

  let followUpEnabled = true;
  let columns = `${BASE_COLUMNS}, ${FOLLOW_UP_COLUMNS}`;
  const rows: Record<string, unknown>[] = [];

  for (let offset = 0; offset < EXPORT_MAX_ROWS; offset += EXPORT_CHUNK) {
    const activeFilters = followUpEnabled ? filters : { ...filters, followUpDue: false };
    let result = await applySort(filteredQuery(supabase, activeFilters, columns), sort, followUpEnabled).range(
      offset,
      offset + EXPORT_CHUNK - 1
    );
    if (offset === 0 && isMissingColumn(result.error)) {
      followUpEnabled = false;
      columns = BASE_COLUMNS;
      result = await applySort(filteredQuery(supabase, { ...filters, followUpDue: false }, columns), sort, false).range(
        offset,
        offset + EXPORT_CHUNK - 1
      );
    }
    if (result.error) {
      if (result.error.code === 'PGRST103') break;
      return res.status(500).json({ error: 'Failed to export enquiries' });
    }
    const chunk = (result.data ?? []) as unknown as Record<string, unknown>[];
    rows.push(...chunk);
    if (chunk.length < EXPORT_CHUNK) break;
  }

  const ids = rows.map((row) => String(row.id));

  const details = await fetchInChunks(ids, (chunk) =>
    supabase.from('quote_requests').select('enquiry_id, category, details').in('enquiry_id', chunk)
  );
  if (details === null) {
    return res.status(500).json({ error: 'Failed to export enquiries' });
  }

  let notes: unknown[] | undefined;
  if (includeNotes) {
    let loaded: unknown[] | null = await fetchInChunks(ids, (chunk) =>
      supabase
        .from('enquiry_notes')
        .select('enquiry_id, note, kind, created_at')
        .in('enquiry_id', chunk)
        .order('created_at', { ascending: true })
    );
    if (loaded === null) {
      loaded = await fetchInChunks(ids, (chunk) =>
        supabase
          .from('enquiry_notes')
          .select('enquiry_id, note, created_at')
          .in('enquiry_id', chunk)
          .order('created_at', { ascending: true })
      );
    }
    if (loaded === null) {
      return res.status(500).json({ error: 'Failed to export internal notes' });
    }
    notes = loaded;
  }

  return res.status(200).json({
    enquiries: rows,
    quoteDetails: details,
    notes,
    truncated: rows.length >= EXPORT_MAX_ROWS,
    followUpEnabled
  });
}

async function loadNotes(supabase: ServiceClient, id: string) {
  let result = await supabase
    .from('enquiry_notes')
    .select('id, note, kind, created_at')
    .eq('enquiry_id', id)
    .order('created_at', { ascending: false });
  if (isMissingColumn(result.error)) {
    result = (await supabase
      .from('enquiry_notes')
      .select('id, note, created_at')
      .eq('enquiry_id', id)
      .order('created_at', { ascending: false })) as typeof result;
  }
  return result;
}

async function getEnquiry(id: string, res: VercelResponse, supabase: ServiceClient) {
  let followUpEnabled = true;
  let enquiryResult = await supabase
    .from('enquiries')
    .select(`${BASE_COLUMNS}, ${FOLLOW_UP_COLUMNS}`)
    .eq('id', id)
    .maybeSingle();
  if (isMissingColumn(enquiryResult.error)) {
    followUpEnabled = false;
    enquiryResult = (await supabase.from('enquiries').select(BASE_COLUMNS).eq('id', id).maybeSingle()) as typeof enquiryResult;
  }
  if (enquiryResult.error) {
    return res.status(500).json({ error: 'Failed to load enquiry' });
  }
  if (!enquiryResult.data) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  const [quote, service, attachments, notes] = await Promise.all([
    supabase.from('quote_requests').select('category, details, created_at').eq('enquiry_id', id).maybeSingle(),
    supabase.from('service_requests').select('service_slug, urgency, created_at').eq('enquiry_id', id).maybeSingle(),
    supabase
      .from('enquiry_attachments')
      .select('id, file_name, mime_type, size_bytes, uploaded_at')
      .eq('enquiry_id', id)
      .order('uploaded_at', { ascending: true }),
    loadNotes(supabase, id)
  ]);

  if (notes.error) {
    return res.status(500).json({ error: 'Failed to load notes' });
  }

  return res.status(200).json({
    enquiry: enquiryResult.data,
    quoteRequest: quote.error ? null : quote.data,
    serviceRequest: service.error ? null : service.data,
    attachments: attachments.error ? [] : attachments.data ?? [],
    notes: notes.data ?? [],
    followUpEnabled
  });
}

function parseBody(req: VercelRequest): Record<string, unknown> | null {
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Validates a PATCH body into a column→value map, or returns an error message. */
export function buildUpdate(body: Record<string, unknown>): Record<string, string | null> | string {
  const fields: Record<string, string | null> = {};

  if (body.status !== undefined) {
    if (typeof body.status !== 'string' || !VALID_STATUSES.includes(body.status)) {
      return `status must be one of: ${VALID_STATUSES.join(', ')}`;
    }
    fields.status = body.status;
  }
  if (body.name !== undefined) {
    const name = String(body.name ?? '').trim();
    if (!name || name.length > 120) return 'Name is required (max 120 characters)';
    fields.name = name;
  }
  if (body.email !== undefined) {
    const email = String(body.email ?? '').trim();
    if (!EMAIL_RE.test(email) || email.length > 254) return 'A valid email address is required';
    fields.email = email;
  }
  if (body.phone !== undefined) {
    const phone = body.phone === null ? '' : String(body.phone).trim();
    if (phone && !PHONE_RE.test(phone)) return 'Phone number may only contain digits, spaces and + ( ) - .';
    fields.phone = phone || null;
  }
  if (body.company_name !== undefined) {
    const company = body.company_name === null ? '' : String(body.company_name).trim();
    if (company.length > 160) return 'Company name is too long (max 160 characters)';
    fields.company_name = company || null;
  }
  for (const key of ['next_follow_up_at', 'last_contacted_at'] as const) {
    if (body[key] === undefined) continue;
    const value = body[key] === null ? '' : String(body[key]).trim();
    if (value && !isValidDate(value)) return `${key} must be a date in YYYY-MM-DD format`;
    fields[key] = value || null;
  }

  if (Object.keys(fields).length === 0) return 'Nothing to update';
  return fields;
}

function formatDateForNote(value: string | null): string {
  if (!value) return 'cleared';
  const [y, m, d] = value.split('-').map(Number);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${d} ${month} ${y}`;
}

async function updateEnquiry(id: string, req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  const body = parseBody(req);
  if (!body) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  const fields = buildUpdate(body);
  if (typeof fields === 'string') {
    return res.status(400).json({ error: fields });
  }

  const touchesFollowUp = 'next_follow_up_at' in fields || 'last_contacted_at' in fields;
  const readColumns = touchesFollowUp ? `${BASE_COLUMNS}, ${FOLLOW_UP_COLUMNS}` : BASE_COLUMNS;

  const current = await supabase.from('enquiries').select(readColumns).eq('id', id).maybeSingle();
  if (isMissingColumn(current.error)) {
    return res.status(409).json({
      error: 'Follow-up dates need database migration 0005_enquiry_follow_up.sql to be applied first.'
    });
  }
  if (current.error) {
    return res.status(500).json({ error: 'The enquiry could not be updated right now. No changes were saved — please try again.' });
  }
  if (!current.data) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }
  const before = current.data as unknown as Record<string, string | null>;

  // Only write what actually changed, so a no-op save doesn't bump updated_at or log history.
  const changes: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(fields)) {
    if ((before[key] ?? null) !== value) changes[key] = value;
  }
  if (Object.keys(changes).length === 0) {
    return res.status(200).json({ enquiry: before, unchanged: true });
  }

  const updated = await supabase.from('enquiries').update(changes).eq('id', id).select(readColumns).single();
  if (updated.error || !updated.data) {
    return res.status(500).json({ error: 'The enquiry could not be updated. No changes were saved.' });
  }

  // History entries, so e.g. how an enquiry reached Converted survives later edits. Best-effort:
  // the update itself already succeeded, so a failed history insert must not report failure.
  const history: { kind: string; note: string }[] = [];
  if ('status' in changes) {
    history.push({ kind: 'status_change', note: `Status changed from ${before.status} to ${changes.status}` });
  }
  if ('next_follow_up_at' in changes) {
    history.push({ kind: 'follow_up', note: `Next follow-up ${changes.next_follow_up_at ? `set to ${formatDateForNote(changes.next_follow_up_at)}` : 'cleared'}` });
  }
  if ('last_contacted_at' in changes) {
    history.push({ kind: 'follow_up', note: `Last contacted ${changes.last_contacted_at ? `on ${formatDateForNote(changes.last_contacted_at)}` : 'date cleared'}` });
  }
  if (history.length > 0) {
    const rows = history.map((entry) => ({ enquiry_id: id, note: entry.note, kind: entry.kind }));
    const inserted = await supabase.from('enquiry_notes').insert(rows);
    if (isMissingColumn(inserted.error)) {
      await supabase.from('enquiry_notes').insert(rows.map(({ enquiry_id, note }) => ({ enquiry_id, note })));
    }
  }

  return res.status(200).json({ enquiry: updated.data });
}

async function addNote(id: string, req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  const body = parseBody(req);
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  if (!note) {
    return res.status(400).json({ error: 'Note text is required' });
  }
  if (note.length > 4000) {
    return res.status(400).json({ error: 'Note is too long (max 4000 characters)' });
  }

  const exists = await supabase.from('enquiries').select('id').eq('id', id).maybeSingle();
  if (exists.error) {
    return res.status(500).json({ error: 'Failed to save note' });
  }
  if (!exists.data) {
    return res.status(404).json({ error: 'Enquiry not found' });
  }

  let inserted = await supabase
    .from('enquiry_notes')
    .insert({ enquiry_id: id, note, kind: 'note' })
    .select('id, note, kind, created_at')
    .single();
  if (isMissingColumn(inserted.error)) {
    inserted = (await supabase
      .from('enquiry_notes')
      .insert({ enquiry_id: id, note })
      .select('id, note, created_at')
      .single()) as typeof inserted;
  }
  if (inserted.error || !inserted.data) {
    return res.status(500).json({ error: 'Failed to save note' });
  }
  return res.status(201).json({ note: inserted.data });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  let supabase: ServiceClient;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const idParam = queryString(req.query.id);
  if (idParam && !UUID_RE.test(idParam)) {
    return res.status(400).json({ error: 'Invalid enquiry id' });
  }
  const id = idParam || null;

  if (req.method === 'GET') {
    if (id) return getEnquiry(id, res, supabase);
    if (queryString(req.query.export) === '1') return exportEnquiries(req, res, supabase);
    return listEnquiries(req, res, supabase);
  }
  if (req.method === 'PATCH' && id) {
    return updateEnquiry(id, req, res, supabase);
  }
  if (req.method === 'POST' && id && queryString(req.query.notes) === '1') {
    return addNote(id, req, res, supabase);
  }

  res.setHeader('Allow', id ? 'GET, PATCH, POST' : 'GET');
  return res.status(405).json({ error: 'Method not allowed' });
}
