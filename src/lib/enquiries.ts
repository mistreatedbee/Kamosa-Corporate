import { serviceSlugOptions } from '../data/services';

// Presentation helpers for the admin Enquiries page. Everything here maps STORED values to labels —
// nothing rewrites what's in the database. Unknown identifiers are shown as-is rather than guessed.

export const ENQUIRY_STATUSES = ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Closed', 'Spam'] as const;

/** Statuses counted together on the "In progress" KPI card — enquiries actively being worked. */
export const ACTIVE_STATUSES = ['Contacted', 'Qualified', 'In Progress'];
/** Statuses that need no further follow-up. */
export const CLOSED_STATUSES = ['Converted', 'Closed', 'Spam'];

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  New: 'Not yet reviewed',
  Contacted: 'First contact made',
  Qualified: 'Genuine opportunity, being scoped',
  'In Progress': 'Quote or work being prepared',
  Converted: 'Resulted in business',
  Closed: 'Closed without business',
  Spam: 'Not a genuine enquiry'
};

export const STATUS_BADGE: Record<string, string> = {
  New: 'bg-info-50 text-info-600 ring-info-600/20',
  Contacted: 'bg-[#EEF0F8] text-[#3F4C8C] ring-[#3F4C8C]/20',
  Qualified: 'bg-[#F3EEF8] text-[#6A3F8C] ring-[#6A3F8C]/20',
  'In Progress': 'bg-warning-50 text-warning-600 ring-warning-600/20',
  Converted: 'bg-success-50 text-success-600 ring-success-600/20',
  Closed: 'bg-[#F1EFEE] text-ink-700 ring-ink-700/15',
  Spam: 'bg-error-50 text-error-600 ring-error-600/20'
};

export const STATUS_DOT: Record<string, string> = {
  New: 'bg-info-600',
  Contacted: 'bg-[#3F4C8C]',
  Qualified: 'bg-[#6A3F8C]',
  'In Progress': 'bg-warning-600',
  Converted: 'bg-success-600',
  Closed: 'bg-ink-700/50',
  Spam: 'bg-error-600'
};

/** enquiries.type check-constraint values (supabase/migrations/0001_enquiries.sql). */
export const TYPE_LABELS: Record<string, string> = {
  general: 'General Enquiry',
  quote_hs: 'Health & Safety Quote Request',
  quote_training: 'Training Quote Request',
  quote_procurement: 'Procurement Quote Request',
  service_request: 'Service Request'
};

export const TYPE_SHORT_LABELS: Record<string, string> = {
  general: 'General enquiry',
  quote_hs: 'H&S quote',
  quote_training: 'Training quote',
  quote_procurement: 'Procurement quote',
  service_request: 'Service request'
};

/** enquiries.source values written by api/enquiry.ts, api/quote-request.ts, api/service-request.ts. */
export const SOURCE_LABELS: Record<string, string> = {
  contact_form: 'Contact form (/contact)',
  request_a_quote: 'Request a quote form (/request-a-quote)',
  request_service: 'Request a service form (/request-service)'
};

export interface ServiceFilterOption {
  key: string;
  label: string;
  /** Every stored service_slug value that means this service. */
  values: string[];
}

// service_slug holds a slug for quote/service requests (from serviceSlugOptions, plus 'general' for
// the quote form's "something else" card) but the service LABEL for contact-form enquiries (the
// contact form's dropdown submits labels). Both spellings map to the same filter option.
export const SERVICE_FILTER_OPTIONS: ServiceFilterOption[] = [
  ...serviceSlugOptions.map((option) => ({ key: option.slug, label: option.label, values: [option.slug, option.label] })),
  { key: 'general', label: 'General / other', values: ['general', 'General Enquiry'] }
];

export function typeLabel(type: string | null | undefined): string {
  if (!type) return 'Not specified';
  return TYPE_LABELS[type] ?? type;
}

export function typeShortLabel(type: string | null | undefined): string {
  if (!type) return 'Not specified';
  return TYPE_SHORT_LABELS[type] ?? type;
}

export function serviceLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = SERVICE_FILTER_OPTIONS.find((option) => option.values.includes(value));
  return match ? match.label : value;
}

export function sourceLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return SOURCE_LABELS[value] ?? value;
}

/** Turns stored detail keys like `participant_count` into "Participant count". */
export function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const QUOTE_TEMPLATE_RE = /^Quote request via \/request-a-quote for ([^\s.]+)\.?$/;

/**
 * A short, readable preview for the table. The quote form stores a machine-ish message
 * ("Quote request via /request-a-quote for training-skills-development.") — shown as
 * "Quote request for Training & Skills Development". The original is always kept and shown in full
 * in the details panel.
 */
export function messagePreview(message: string | null | undefined, maxLength = 120): string {
  const text = (message ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  const quote = text.match(QUOTE_TEMPLATE_RE);
  const readable = quote ? `Quote request for ${serviceLabel(quote[1])}` : text;
  return readable.length > maxLength ? `${readable.slice(0, maxLength - 1).trimEnd()}…` : readable;
}

// All dates are shown in South African time, whatever the admin's device timezone.
export const TIME_ZONE = 'Africa/Johannesburg';

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}:${get('minute')}`;
}

/** Long form for tooltips/detail view, e.g. "Friday, 16 October 2026 at 15:54 SAST". */
export function formatDateTimeLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  return `${day} at ${time} SAST`;
}

/** Formats a date-only value (YYYY-MM-DD) without any timezone shifting. */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
  const [y, m, d] = value.split('-').map(Number);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${d} ${month} ${y}`;
}

/** Today's date in South Africa as YYYY-MM-DD. */
export function todayInSouthAfrica(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function addDaysToDate(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

export type FollowUpState = 'overdue' | 'today' | 'soon' | 'scheduled' | null;

/** Follow-up urgency. Closed/converted/spam enquiries never show as needing follow-up. */
export function followUpState(nextFollowUp: string | null | undefined, status: string, today: string): FollowUpState {
  if (!nextFollowUp || CLOSED_STATUSES.includes(status)) return null;
  if (nextFollowUp < today) return 'overdue';
  if (nextFollowUp === today) return 'today';
  if (nextFollowUp <= addDaysToDate(today, 2)) return 'soon';
  return 'scheduled';
}

export const FOLLOW_UP_LABEL: Record<Exclude<FollowUpState, null>, string> = {
  overdue: 'Follow-up overdue',
  today: 'Follow up today',
  soon: 'Follow-up soon',
  scheduled: 'Follow-up scheduled'
};

// ---------------------------------------------------------------------------------------------
// Filters ⇄ URL search params, so the list keeps its filters when the details panel opens/closes,
// on reload, and when the link is shared with another admin.

export type SortOption = 'newest' | 'oldest' | 'updated' | 'follow_up';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'updated', label: 'Recently updated' },
  { value: 'follow_up', label: 'Follow-up date' }
];

export interface EnquiryFilters {
  q: string;
  statuses: string[];
  type: string;
  service: string;
  from: string;
  to: string;
  followUp: '' | 'due';
  sort: SortOption;
  page: number;
}

export const EMPTY_FILTERS: EnquiryFilters = {
  q: '',
  statuses: [],
  type: '',
  service: '',
  from: '',
  to: '',
  followUp: '',
  sort: 'newest',
  page: 1
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function filtersFromParams(params: URLSearchParams): EnquiryFilters {
  const sort = params.get('sort') as SortOption | null;
  const page = Number(params.get('page'));
  const statuses = (params.get('status') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => (ENQUIRY_STATUSES as readonly string[]).includes(s));
  const type = params.get('type') ?? '';
  const service = params.get('service') ?? '';
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  return {
    q: params.get('q') ?? '',
    statuses,
    type: TYPE_LABELS[type] ? type : '',
    service: SERVICE_FILTER_OPTIONS.some((option) => option.key === service) ? service : '',
    from: DATE_RE.test(from) ? from : '',
    to: DATE_RE.test(to) ? to : '',
    followUp: params.get('followUp') === 'due' ? 'due' : '',
    sort: sort && SORT_OPTIONS.some((option) => option.value === sort) ? sort : 'newest',
    page: Number.isInteger(page) && page > 1 ? page : 1
  };
}

/** Writes filters into params, leaving any unrelated params (e.g. the open enquiry) untouched. */
export function applyFiltersToParams(filters: EnquiryFilters, base: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(base);
  const set = (key: string, value: string) => (value ? params.set(key, value) : params.delete(key));
  set('q', filters.q.trim());
  set('status', filters.statuses.join(','));
  set('type', filters.type);
  set('service', filters.service);
  set('from', filters.from);
  set('to', filters.to);
  set('followUp', filters.followUp);
  set('sort', filters.sort === 'newest' ? '' : filters.sort);
  set('page', filters.page > 1 ? String(filters.page) : '');
  return params;
}

/** Query string for GET /api/admin/enquiries — services expand to every stored alias. */
export function filtersToApiParams(filters: EnquiryFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.statuses.length) params.set('status', filters.statuses.join(','));
  if (filters.type) params.set('type', filters.type);
  const service = SERVICE_FILTER_OPTIONS.find((option) => option.key === filters.service);
  // One param per stored spelling — labels can contain commas, so they're never joined.
  service?.values.forEach((value) => params.append('service', value));
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.followUp) params.set('followUp', filters.followUp);
  if (filters.sort !== 'newest') params.set('sort', filters.sort);
  return params;
}

export function hasActiveFilters(filters: EnquiryFilters): boolean {
  return Boolean(
    filters.q.trim() || filters.statuses.length || filters.type || filters.service || filters.from || filters.to || filters.followUp
  );
}

// ---------------------------------------------------------------------------------------------
// CSV export

export interface ExportEnquiry {
  id: string;
  type: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  message: string | null;
  service_slug: string | null;
  source: string | null;
  created_at: string;
  updated_at?: string | null;
  next_follow_up_at?: string | null;
  last_contacted_at?: string | null;
}

export interface ExportQuoteDetail {
  enquiry_id: string;
  category: string;
  details: Record<string, unknown> | null;
}

export interface ExportNote {
  enquiry_id: string;
  note: string;
  kind?: string;
  created_at: string;
}

/**
 * RFC 4180 field: always quoted, quotes doubled; line breaks kept inside the quotes. Values that
 * start with = + - @ (or tab/CR) are prefixed with an apostrophe so spreadsheet apps don't execute
 * them as formulas (CSV injection) — this changes how the cell displays, not the stored record.
 */
export function csvField(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Date+time for CSV in SAST, sortable: "2026-10-16 15:54". */
export function csvDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}`;
}

export function buildEnquiriesCsv(
  enquiries: ExportEnquiry[],
  options: { quoteDetails?: ExportQuoteDetail[]; notes?: ExportNote[]; includeNotes?: boolean; includeFollowUp?: boolean } = {}
): string {
  const detailsById = new Map<string, ExportQuoteDetail>();
  (options.quoteDetails ?? []).forEach((detail) => detailsById.set(detail.enquiry_id, detail));
  const notesById = new Map<string, ExportNote[]>();
  (options.notes ?? []).forEach((note) => {
    const list = notesById.get(note.enquiry_id) ?? [];
    list.push(note);
    notesById.set(note.enquiry_id, list);
  });

  const header = [
    'Received (SAST)',
    'Contact name',
    'Email',
    'Phone',
    'Company',
    'Enquiry type',
    'Service',
    'Status',
    'Source',
    'Original message',
    'Submitted details',
    'Last updated (SAST)',
    ...(options.includeFollowUp ? ['Next follow-up', 'Last contacted'] : []),
    ...(options.includeNotes ? ['Internal notes'] : []),
    'Enquiry ID'
  ];

  const rows = enquiries.map((e) => {
    const detail = detailsById.get(e.id);
    const detailText = detail?.details
      ? Object.entries(detail.details)
          .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
          .map(([key, value]) => `${humanizeKey(key)}: ${String(value)}`)
          .join('; ')
      : '';
    const notesText = (notesById.get(e.id) ?? [])
      .map((note) => `[${csvDateTime(note.created_at)}] ${note.note}`)
      .join('\n');
    return [
      csvDateTime(e.created_at),
      e.name,
      e.email,
      e.phone ?? '',
      e.company_name ?? '',
      typeLabel(e.type),
      serviceLabel(e.service_slug) ?? '',
      e.status,
      sourceLabel(e.source) ?? '',
      e.message ?? '',
      detailText,
      csvDateTime(e.updated_at),
      ...(options.includeFollowUp ? [e.next_follow_up_at ?? '', e.last_contacted_at ?? ''] : []),
      ...(options.includeNotes ? [notesText] : []),
      e.id
    ];
  });

  // CRLF per RFC 4180; the BOM makes Excel read the file as UTF-8 (names like "Thandiwé").
  return '\uFEFF' + [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');
}

export type EnquiryRecord = ExportEnquiry;
