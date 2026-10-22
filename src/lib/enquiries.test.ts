import { describe, expect, it } from 'vitest';
import {
  EMPTY_FILTERS,
  applyFiltersToParams,
  buildEnquiriesCsv,
  csvDateTime,
  csvField,
  filtersFromParams,
  filtersToApiParams,
  followUpState,
  formatDateOnly,
  formatDateTime,
  hasActiveFilters,
  messagePreview,
  serviceLabel,
  sourceLabel,
  todayInSouthAfrica,
  typeLabel
} from './enquiries';
import type { ExportEnquiry } from './enquiries';

// Mirrors the real record currently in production (see the task brief).
const ASH: ExportEnquiry = {
  id: '11111111-1111-4111-8111-111111111111',
  type: 'quote_training',
  status: 'In Progress',
  name: 'Ash',
  email: 'workatpaaq@gmail.com',
  phone: '0731531188',
  company_name: 'NextWave',
  message: 'Quote request via /request-a-quote for training-skills-development.',
  service_slug: 'training-skills-development',
  source: 'request_a_quote',
  created_at: '2026-10-16T13:54:00+00:00',
  updated_at: '2026-10-17T08:00:00+00:00'
};

describe('labels', () => {
  it('maps every stored enquiry type to a readable label', () => {
    expect(typeLabel('quote_training')).toBe('Training Quote Request');
    expect(typeLabel('quote_hs')).toBe('Health & Safety Quote Request');
    expect(typeLabel('quote_procurement')).toBe('Procurement Quote Request');
    expect(typeLabel('general')).toBe('General Enquiry');
    expect(typeLabel('service_request')).toBe('Service Request');
  });

  it('shows unknown identifiers as-is instead of guessing', () => {
    expect(typeLabel('mystery_type')).toBe('mystery_type');
    expect(serviceLabel('some-new-service')).toBe('some-new-service');
    expect(sourceLabel('partner_api')).toBe('partner_api');
  });

  it('maps service slugs AND the contact form’s stored labels to the same name', () => {
    expect(serviceLabel('training-skills-development')).toBe('Training & Skills Development');
    expect(serviceLabel('Training & Skills Development')).toBe('Training & Skills Development');
    expect(serviceLabel('environmental')).toBe('Environmental Management');
    expect(serviceLabel('General Enquiry')).toBe('General / other');
    expect(serviceLabel(null)).toBeNull();
  });
});

describe('messagePreview', () => {
  it('turns the quote form’s templated message into plain English', () => {
    expect(messagePreview(ASH.message)).toBe('Quote request for Training & Skills Development');
  });

  it('collapses whitespace and truncates long messages', () => {
    const long = `Hello\n\n${'word '.repeat(60)}`;
    const preview = messagePreview(long, 40);
    expect(preview.length).toBeLessThanOrEqual(40);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview).not.toContain('\n');
  });

  it('returns an empty string for missing messages', () => {
    expect(messagePreview(null)).toBe('');
    expect(messagePreview('   ')).toBe('');
  });
});

describe('dates (always South African time)', () => {
  it('formats the stored timestamp in SAST regardless of device timezone', () => {
    // 13:54 UTC is 15:54 SAST — the "16 October at 15:54" shown on the old page.
    expect(formatDateTime(ASH.created_at)).toBe('16 Oct 2026, 15:54');
    expect(csvDateTime(ASH.created_at)).toBe('2026-10-16 15:54');
  });

  it('rolls the date over at SAST midnight, not UTC midnight', () => {
    expect(formatDateTime('2026-10-16T22:30:00Z')).toBe('17 Oct 2026, 00:30');
    expect(todayInSouthAfrica(new Date('2026-10-16T22:30:00Z'))).toBe('2026-10-17');
  });

  it('formats date-only values without shifting them', () => {
    expect(formatDateOnly('2026-10-25')).toBe('25 Oct 2026');
    expect(formatDateOnly(null)).toBe('—');
  });
});

describe('followUpState', () => {
  const today = '2026-10-21';
  it('flags overdue, today, soon and scheduled follow-ups', () => {
    expect(followUpState('2026-10-20', 'In Progress', today)).toBe('overdue');
    expect(followUpState('2026-10-21', 'New', today)).toBe('today');
    expect(followUpState('2026-10-23', 'Contacted', today)).toBe('soon');
    expect(followUpState('2026-11-30', 'Qualified', today)).toBe('scheduled');
  });

  it('never flags closed, converted or spam enquiries, or ones without a date', () => {
    expect(followUpState('2026-10-01', 'Converted', today)).toBeNull();
    expect(followUpState('2026-10-01', 'Closed', today)).toBeNull();
    expect(followUpState('2026-10-01', 'Spam', today)).toBeNull();
    expect(followUpState(null, 'New', today)).toBeNull();
  });
});

describe('filters ⇄ URL', () => {
  it('round-trips every filter through the URL and keeps unrelated params', () => {
    const filters = {
      ...EMPTY_FILTERS,
      q: 'nextwave',
      statuses: ['Contacted', 'Qualified', 'In Progress'],
      type: 'quote_training',
      service: 'training-skills-development',
      from: '2026-10-01',
      to: '2026-10-31',
      followUp: 'due' as const,
      sort: 'oldest' as const,
      page: 3
    };
    const params = applyFiltersToParams(filters, new URLSearchParams('enquiry=abc'));
    expect(params.get('enquiry')).toBe('abc');
    expect(filtersFromParams(params)).toEqual(filters);
  });

  it('drops invalid values from a hand-edited URL', () => {
    const parsed = filtersFromParams(new URLSearchParams('status=New,Bogus&type=nope&service=nope&from=yesterday&sort=random&page=-2'));
    expect(parsed.statuses).toEqual(['New']);
    expect(parsed.type).toBe('');
    expect(parsed.service).toBe('');
    expect(parsed.from).toBe('');
    expect(parsed.sort).toBe('newest');
    expect(parsed.page).toBe(1);
  });

  it('expands a service filter to every stored spelling for the API', () => {
    const params = filtersToApiParams({ ...EMPTY_FILTERS, service: 'training-skills-development' });
    expect(params.getAll('service')).toEqual(['training-skills-development', 'Training & Skills Development']);
    const hs = filtersToApiParams({ ...EMPTY_FILTERS, service: 'health-safety-compliance' });
    expect(hs.getAll('service')).toEqual(['health-safety-compliance', 'Health, Safety & Compliance']);
  });

  it('defaults to newest first with no filters active', () => {
    expect(filtersToApiParams(EMPTY_FILTERS).toString()).toBe('');
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, sort: 'oldest' })).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, type: 'general' })).toBe(true);
  });
});

describe('CSV export', () => {
  const parseCsv = (csv: string) => {
    // Minimal RFC 4180 parser for assertions.
    const text = csv.replace(/^\uFEFF/, '');
    const rows: string[][] = [];
    let row: string[] = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') {
          field += '"';
          i++;
        } else if (ch === '"') quoted = false;
        else field += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r' && text[i + 1] === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else field += ch;
    }
    row.push(field);
    rows.push(row);
    return rows;
  };

  it('escapes quotes, commas and line breaks', () => {
    expect(csvField('He said "hi", then left\nthe room')).toBe('"He said ""hi"", then left\nthe room"');
    expect(csvField(null)).toBe('""');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvField('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvField('+27 73 153 1188')).toBe('"\'+27 73 153 1188"');
  });

  it('uses readable labels but keeps the original message and id', () => {
    const tricky: ExportEnquiry = { ...ASH, id: '22222222-2222-4222-8222-222222222222', name: 'O"Brien, Pat', message: 'Line one\nLine "two", with comma', company_name: null };
    const csv = buildEnquiriesCsv([ASH, tricky], {
      quoteDetails: [{ enquiry_id: ASH.id, category: 'training', details: { course: 'First Aid Level 1', participant_count: '12', empty: '' } }]
    });
    expect(csv.startsWith('\uFEFF')).toBe(true);
    const rows = parseCsv(csv);
    const header = rows[0];
    expect(header).toContain('Enquiry type');
    expect(header).not.toContain('Internal notes');
    expect(header).not.toContain('Next follow-up');

    const ash = Object.fromEntries(header.map((h, i) => [h, rows[1][i]]));
    expect(ash['Received (SAST)']).toBe('2026-10-16 15:54');
    expect(ash['Enquiry type']).toBe('Training Quote Request');
    expect(ash['Service']).toBe('Training & Skills Development');
    expect(ash['Status']).toBe('In Progress');
    expect(ash['Original message']).toBe(ASH.message);
    expect(ash['Submitted details']).toBe('Course: First Aid Level 1; Participant count: 12');
    expect(ash['Enquiry ID']).toBe(ASH.id);

    const second = Object.fromEntries(header.map((h, i) => [h, rows[2][i]]));
    expect(second['Contact name']).toBe('O"Brien, Pat');
    expect(second['Original message']).toBe('Line one\nLine "two", with comma');
    expect(second['Company']).toBe('');
    expect(rows).toHaveLength(3);
  });

  it('only includes internal notes and follow-up columns when explicitly requested', () => {
    const csv = buildEnquiriesCsv([{ ...ASH, next_follow_up_at: '2026-10-25', last_contacted_at: '2026-10-20' }], {
      notes: [
        { enquiry_id: ASH.id, note: 'Client contacted.', created_at: '2026-10-17T08:00:00Z' },
        { enquiry_id: ASH.id, note: 'Quote being prepared.', created_at: '2026-10-18T08:00:00Z' }
      ],
      includeNotes: true,
      includeFollowUp: true
    });
    const rows = parseCsv(csv);
    const record = Object.fromEntries(rows[0].map((h, i) => [h, rows[1][i]]));
    expect(record['Internal notes']).toBe('[2026-10-17 10:00] Client contacted.\n[2026-10-18 10:00] Quote being prepared.');
    expect(record['Next follow-up']).toBe('2026-10-25');
    expect(record['Last contacted']).toBe('2026-10-20');
  });
});
