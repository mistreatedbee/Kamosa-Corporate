import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  AlarmClockIcon,
  ArrowLeftIcon,
  Building2Icon,
  CalendarIcon,
  HistoryIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
  PaperclipIcon,
  PencilIcon,
  PhoneIcon,
  RefreshCwIcon,
  StickyNoteIcon,
  UserIcon
} from 'lucide-react';
import { adminRequest } from '../../lib/adminApi';
import {
  ENQUIRY_STATUSES,
  STATUS_DESCRIPTIONS,
  addDaysToDate,
  followUpState,
  formatDateOnly,
  formatDateTime,
  formatDateTimeLong,
  humanizeKey,
  serviceLabel,
  sourceLabel,
  todayInSouthAfrica,
  typeLabel
} from '../../lib/enquiries';
import type { EnquiryRecord } from '../../lib/enquiries';
import { FollowUpIndicator, SectionHeading, StatusBadge } from './EnquiryParts';

interface Note {
  id: string;
  note: string;
  kind?: string;
  created_at: string;
}

interface Detail {
  enquiry: EnquiryRecord;
  quoteRequest: { category: string; details: Record<string, unknown> | null; created_at: string } | null;
  serviceRequest: { service_slug: string; urgency: string | null; created_at: string } | null;
  attachments: { id: string; file_name: string; mime_type: string | null; size_bytes: number | null; uploaded_at: string }[];
  notes: Note[];
  followUpEnabled: boolean;
}

const NOTE_TEMPLATES = ['Client contacted.', 'Awaiting client response.', 'Quote being prepared.', 'Meeting scheduled for ', 'Follow-up required: '];

const QUOTE_CATEGORY_LABELS: Record<string, string> = {
  health_safety: 'Health & Safety',
  training: 'Training',
  procurement: 'Procurement'
};

const inputClass =
  'w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 placeholder:text-muted/70 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-700/10 disabled:bg-[#F4F2F1]';
const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-ink-900 px-3.5 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-150 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-2 text-[0.8125rem] font-semibold text-ink-900 transition-colors duration-150 hover:bg-[#F4F2F1] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

interface Props {
  enquiryId: string;
  onClose: () => void;
  /** Called with the saved row after any successful update, so the list + KPIs can refresh. */
  onUpdated: (enquiry: EnquiryRecord) => void;
  onNotify: (tone: 'success' | 'error', text: string) => void;
  onUnauthorized: () => void;
}

export function EnquiryDetailPanel({ enquiryId, onClose, onUpdated, onNotify, onUnauthorized }: Props) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    const result = await adminRequest<Detail>(`/api/admin/enquiries?id=${encodeURIComponent(enquiryId)}`);
    if (result.status === 401) return onUnauthorized();
    if (!result.ok || !result.data) {
      setLoadError(result.status === 404 ? 'This enquiry no longer exists.' : result.error ?? 'Could not load this enquiry.');
      return;
    }
    setDetail(result.data);
  }, [enquiryId, onUnauthorized]);

  useEffect(() => {
    setDetail(null);
    load();
  }, [load]);

  // Dialog behaviour: focus moves in on open and back to the trigger on close; Escape closes; Tab
  // stays inside the panel; the page behind doesn't scroll.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Let an open menu/select inside the panel handle its own Escape first.
        if ((event.target as HTMLElement | null)?.closest('[role="menu"]')) return;
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const applySaved = (enquiry: EnquiryRecord, refreshNotes: boolean) => {
    setDetail((prev) => (prev ? { ...prev, enquiry: { ...prev.enquiry, ...enquiry } } : prev));
    onUpdated(enquiry);
    if (refreshNotes) refreshNoteList();
  };

  const refreshNoteList = async () => {
    const result = await adminRequest<Detail>(`/api/admin/enquiries?id=${encodeURIComponent(enquiryId)}`);
    const fresh = result.data;
    if (result.ok && fresh) {
      setDetail((prev) => (prev ? { ...prev, notes: fresh.notes } : prev));
    }
  };

  const enquiry = detail?.enquiry;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink-900/40" aria-hidden={true} onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-panel-title"
        className="relative flex h-full w-full max-w-2xl flex-col bg-[#FAF9F8] shadow-lift">
        <header className="flex items-start gap-3 border-b border-hairline bg-white px-5 py-4 sm:px-6">
          <button ref={closeRef} type="button" onClick={onClose} className={`${secondaryButton} px-2.5`} aria-label="Back to enquiries">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden={true} />
            <span className="hidden sm:inline">Back to list</span>
          </button>
          <div className="min-w-0 flex-1">
            <h2 id="enquiry-panel-title" className="truncate font-display text-lg font-bold text-ink-900">
              {enquiry ? enquiry.name : 'Enquiry details'}
            </h2>
            {enquiry ? (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-muted">
                <span>{typeLabel(enquiry.type)}</span>
                <span aria-hidden={true}>·</span>
                <span title={formatDateTimeLong(enquiry.created_at)}>Received {formatDateTime(enquiry.created_at)}</span>
              </p>
            ) : null}
          </div>
          {enquiry ? <StatusBadge status={enquiry.status} /> : null}
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {!detail && !loadError ? (
            <div className="flex items-center gap-2 py-10 text-[0.875rem] text-muted">
              <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
              Loading enquiry…
            </div>
          ) : null}

          {loadError ? (
            <div className="rounded-lg border border-error-600/20 bg-error-50 p-4 text-[0.875rem] text-error-600">
              <p>{loadError}</p>
              <button type="button" onClick={load} className={`${secondaryButton} mt-3`}>
                <RefreshCwIcon className="h-3.5 w-3.5" aria-hidden={true} />
                Try again
              </button>
            </div>
          ) : null}

          {detail && enquiry ? (
            <div className="space-y-5">
              <StatusSection
                key={`status-${enquiry.status}`}
                enquiry={enquiry}
                onSaved={(saved) => applySaved(saved, true)}
                onNotify={onNotify}
                onUnauthorized={onUnauthorized}
              />

              <ContactSection
                enquiry={enquiry}
                onSaved={(saved) => applySaved(saved, false)}
                onNotify={onNotify}
                onUnauthorized={onUnauthorized}
              />

              <Card>
                <SectionHeading>Enquiry</SectionHeading>
                <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  <Field label="Enquiry type" value={typeLabel(enquiry.type)} />
                  <Field label="Requested service" value={serviceLabel(enquiry.service_slug)} />
                  <Field label="Submitted" value={formatDateTimeLong(enquiry.created_at)} />
                  <Field label="Source" value={sourceLabel(enquiry.source)} />
                  {detail.quoteRequest ? (
                    <Field label="Quote category" value={QUOTE_CATEGORY_LABELS[detail.quoteRequest.category] ?? detail.quoteRequest.category} />
                  ) : null}
                  {detail.serviceRequest?.urgency ? <Field label="Urgency" value={humanizeKey(detail.serviceRequest.urgency)} /> : null}
                  <Field label="Last updated" value={formatDateTime(enquiry.updated_at)} />
                </dl>

                {detail.quoteRequest?.details && Object.keys(detail.quoteRequest.details).length > 0 ? (
                  <div className="mt-4 border-t border-hairline pt-4">
                    <p className="text-[0.75rem] font-semibold text-muted">Submitted quote details</p>
                    <dl className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {Object.entries(detail.quoteRequest.details)
                        .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
                        .map(([key, value]) => (
                          <Field key={key} label={humanizeKey(key)} value={String(value)} />
                        ))}
                    </dl>
                  </div>
                ) : null}

                <div className="mt-4 border-t border-hairline pt-4">
                  <p className="text-[0.75rem] font-semibold text-muted">Original message from the client</p>
                  {enquiry.message ? (
                    <p className="mt-2 whitespace-pre-wrap break-words rounded-md border border-hairline bg-[#FAF9F8] p-3 text-[0.875rem] leading-relaxed text-ink-900">
                      {enquiry.message}
                    </p>
                  ) : (
                    <p className="mt-2 text-[0.875rem] italic text-muted">No message was included.</p>
                  )}
                </div>

                {detail.attachments.length > 0 ? (
                  <div className="mt-4 border-t border-hairline pt-4">
                    <p className="text-[0.75rem] font-semibold text-muted">Attachments</p>
                    <ul className="mt-2 space-y-1.5">
                      {detail.attachments.map((file) => (
                        <li key={file.id} className="flex items-center gap-2 text-[0.8125rem] text-ink-900">
                          <PaperclipIcon className="h-3.5 w-3.5 text-muted" aria-hidden={true} />
                          {file.file_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>

              <FollowUpSection
                enquiry={enquiry}
                enabled={detail.followUpEnabled}
                onSaved={(saved) => applySaved(saved, true)}
                onNotify={onNotify}
                onUnauthorized={onUnauthorized}
              />

              <NotesSection
                enquiryId={enquiry.id}
                notes={detail.notes}
                onAdded={(note) => setDetail((prev) => (prev ? { ...prev, notes: [note, ...prev.notes] } : prev))}
                onNotify={onNotify}
                onUnauthorized={onUnauthorized}
              />
            </div>
          ) : null}
        </div>

        {enquiry ? (
          <footer className="flex flex-wrap gap-2 border-t border-hairline bg-white px-5 py-3 sm:px-6">
            <a href={`mailto:${enquiry.email}?subject=${encodeURIComponent('Your enquiry to Kamosa')}`} className={secondaryButton}>
              <MailIcon className="h-4 w-4" aria-hidden={true} />
              Email client
            </a>
            {enquiry.phone ? (
              <a href={`tel:${enquiry.phone.replace(/[^0-9+]/g, '')}`} className={secondaryButton}>
                <PhoneIcon className="h-4 w-4" aria-hidden={true} />
                Call
              </a>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-hairline bg-white p-4 sm:p-5">{children}</section>;
}

function Field({ label, value, children }: { label: string; value?: string | null; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.75rem] text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-[0.875rem] text-ink-900">
        {children ?? (value ? value : <span className="italic text-muted">Not provided</span>)}
      </dd>
    </div>
  );
}

interface SectionProps {
  enquiry: EnquiryRecord;
  onSaved: (enquiry: EnquiryRecord) => void;
  onNotify: Props['onNotify'];
  onUnauthorized: () => void;
}

async function patchEnquiry(id: string, body: Record<string, unknown>) {
  return adminRequest<{ enquiry: EnquiryRecord; unchanged?: boolean }>(`/api/admin/enquiries?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
}

function StatusSection({ enquiry, onSaved, onNotify, onUnauthorized }: SectionProps) {
  const [status, setStatus] = useState(enquiry.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = status !== enquiry.status;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    const result = await patchEnquiry(enquiry.id, { status });
    setSaving(false);
    if (result.status === 401) return onUnauthorized();
    if (!result.ok || !result.data) {
      const message = result.error ?? 'The status could not be updated. Nothing was changed.';
      setError(message);
      onNotify('error', message);
      return;
    }
    onSaved(result.data.enquiry);
    onNotify('success', `Status changed to ${result.data.enquiry.status}.`);
  };

  return (
    <Card>
      <SectionHeading>Status</SectionHeading>
      <form onSubmit={save} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="enquiry-status" className="text-[0.75rem] text-muted">
            Current status
          </label>
          <select
            id="enquiry-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={saving}
            className={`${inputClass} mt-1`}>
            {ENQUIRY_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option} — {STATUS_DESCRIPTIONS[option]}
              </option>
            ))}
            {!(ENQUIRY_STATUSES as readonly string[]).includes(enquiry.status) ? (
              <option value={enquiry.status}>{enquiry.status}</option>
            ) : null}
          </select>
        </div>
        <div className="flex gap-2">
          {dirty ? (
            <button type="button" onClick={() => setStatus(enquiry.status)} disabled={saving} className={secondaryButton}>
              Cancel
            </button>
          ) : null}
          <button type="submit" disabled={!dirty || saving} className={primaryButton}>
            {saving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden={true} /> : null}
            {saving ? 'Saving…' : 'Update status'}
          </button>
        </div>
      </form>
      {status === 'Converted' && dirty ? (
        <p className="mt-2 text-[0.75rem] text-muted">Only mark as Converted once the enquiry has actually resulted in business.</p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-2 text-[0.8125rem] text-error-600">
          {error}
        </p>
      ) : null}
    </Card>
  );
}

function ContactSection({ enquiry, onSaved, onNotify, onUnauthorized }: SectionProps) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ name: '', email: '', phone: '', company_name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = () => {
    setValues({ name: enquiry.name, email: enquiry.email, phone: enquiry.phone ?? '', company_name: enquiry.company_name ?? '' });
    setError(null);
    setEditing(true);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    const result = await patchEnquiry(enquiry.id, {
      name: values.name,
      email: values.email,
      phone: values.phone || null,
      company_name: values.company_name || null
    });
    setSaving(false);
    if (result.status === 401) return onUnauthorized();
    if (!result.ok || !result.data) {
      setError(result.error ?? 'The contact details could not be saved. Nothing was changed.');
      return;
    }
    setEditing(false);
    onSaved(result.data.enquiry);
    onNotify('success', result.data.unchanged ? 'No changes to save.' : 'Contact details updated.');
  };

  return (
    <Card>
      <SectionHeading
        action={
          editing ? null : (
            <button type="button" onClick={startEditing} className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-ink-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
              <PencilIcon className="h-3.5 w-3.5" aria-hidden={true} />
              Edit
            </button>
          )
        }>
        Contact
      </SectionHeading>

      {editing ? (
        <form onSubmit={save} className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ['name', 'Full name', 'text', 'name', true],
              ['email', 'Email', 'email', 'email', true],
              ['phone', 'Phone', 'tel', 'tel', false],
              ['company_name', 'Company', 'text', 'organization', false]
            ] as const
          ).map(([key, label, type, autoComplete, required]) => (
            <div key={key}>
              <label htmlFor={`contact-${key}`} className="text-[0.75rem] text-muted">
                {label}
                {required ? ' *' : ''}
              </label>
              <input
                id={`contact-${key}`}
                type={type}
                autoComplete={autoComplete}
                required={required}
                value={values[key]}
                onChange={(event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))}
                disabled={saving}
                className={`${inputClass} mt-1`}
              />
            </div>
          ))}
          {error ? (
            <p role="alert" className="text-[0.8125rem] text-error-600 sm:col-span-2">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden={true} /> : null}
              {saving ? 'Saving…' : 'Save contact details'}
            </button>
            <button type="button" onClick={() => setEditing(false)} disabled={saving} className={secondaryButton}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <Field label="Full name">
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-muted" aria-hidden={true} />
              {enquiry.name}
            </span>
          </Field>
          <Field label="Company">
            <span className="inline-flex items-center gap-1.5">
              <Building2Icon className="h-3.5 w-3.5 text-muted" aria-hidden={true} />
              {enquiry.company_name || <span className="italic text-muted">Not provided</span>}
            </span>
          </Field>
          <Field label="Email">
            <a href={`mailto:${enquiry.email}`} className="inline-flex items-center gap-1.5 break-all text-info-600 hover:underline">
              <MailIcon className="h-3.5 w-3.5 shrink-0" aria-hidden={true} />
              {enquiry.email}
            </a>
          </Field>
          <Field label="Phone">
            {enquiry.phone ? (
              <a href={`tel:${enquiry.phone.replace(/[^0-9+]/g, '')}`} className="inline-flex items-center gap-1.5 text-info-600 hover:underline">
                <PhoneIcon className="h-3.5 w-3.5" aria-hidden={true} />
                {enquiry.phone}
              </a>
            ) : (
              <span className="italic text-muted">Not provided</span>
            )}
          </Field>
        </dl>
      )}
    </Card>
  );
}

function FollowUpSection({ enquiry, enabled, onSaved, onNotify, onUnauthorized }: SectionProps & { enabled: boolean }) {
  const [nextFollowUp, setNextFollowUp] = useState(enquiry.next_follow_up_at ?? '');
  const [lastContacted, setLastContacted] = useState(enquiry.last_contacted_at ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayInSouthAfrica();

  useEffect(() => {
    setNextFollowUp(enquiry.next_follow_up_at ?? '');
    setLastContacted(enquiry.last_contacted_at ?? '');
  }, [enquiry.next_follow_up_at, enquiry.last_contacted_at]);

  const dirty = nextFollowUp !== (enquiry.next_follow_up_at ?? '') || lastContacted !== (enquiry.last_contacted_at ?? '');
  const state = followUpState(enquiry.next_follow_up_at, enquiry.status, today);

  if (!enabled) {
    return (
      <Card>
        <SectionHeading>Follow-up</SectionHeading>
        <p className="mt-2 text-[0.8125rem] text-muted">
          Follow-up dates become available once database migration <code>0005_enquiry_follow_up.sql</code> has been applied.
        </p>
      </Card>
    );
  }

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    const result = await patchEnquiry(enquiry.id, {
      next_follow_up_at: nextFollowUp || null,
      last_contacted_at: lastContacted || null
    });
    setSaving(false);
    if (result.status === 401) return onUnauthorized();
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Follow-up details could not be saved. Nothing was changed.');
      return;
    }
    onSaved(result.data.enquiry);
    onNotify('success', 'Follow-up details saved.');
  };

  const quick = 'rounded-full border border-hairline bg-white px-2.5 py-1 text-[0.75rem] font-medium text-ink-900 hover:bg-[#F4F2F1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50';

  return (
    <Card>
      <SectionHeading action={<FollowUpIndicator state={state} date={enquiry.next_follow_up_at} />}>Follow-up</SectionHeading>
      <form onSubmit={save} className="mt-3 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="next-follow-up" className="flex items-center gap-1.5 text-[0.75rem] text-muted">
              <AlarmClockIcon className="h-3.5 w-3.5" aria-hidden={true} />
              Next follow-up
            </label>
            <input id="next-follow-up" type="date" value={nextFollowUp} onChange={(event) => setNextFollowUp(event.target.value)} disabled={saving} className={`${inputClass} mt-1`} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className={quick} disabled={saving} onClick={() => setNextFollowUp(addDaysToDate(today, 1))}>
                Tomorrow
              </button>
              <button type="button" className={quick} disabled={saving} onClick={() => setNextFollowUp(addDaysToDate(today, 3))}>
                In 3 days
              </button>
              <button type="button" className={quick} disabled={saving} onClick={() => setNextFollowUp(addDaysToDate(today, 7))}>
                In a week
              </button>
              {nextFollowUp ? (
                <button type="button" className={quick} disabled={saving} onClick={() => setNextFollowUp('')}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
          <div>
            <label htmlFor="last-contacted" className="flex items-center gap-1.5 text-[0.75rem] text-muted">
              <CalendarIcon className="h-3.5 w-3.5" aria-hidden={true} />
              Last contacted
            </label>
            <input id="last-contacted" type="date" max={today} value={lastContacted} onChange={(event) => setLastContacted(event.target.value)} disabled={saving} className={`${inputClass} mt-1`} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className={quick} disabled={saving} onClick={() => setLastContacted(today)}>
                Today
              </button>
              {lastContacted ? (
                <button type="button" className={quick} disabled={saving} onClick={() => setLastContacted('')}>
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </div>
        {error ? (
          <p role="alert" className="text-[0.8125rem] text-error-600">
            {error}
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <button type="submit" disabled={!dirty || saving} className={primaryButton}>
            {saving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden={true} /> : null}
            {saving ? 'Saving…' : 'Save follow-up'}
          </button>
          {!dirty && (enquiry.next_follow_up_at || enquiry.last_contacted_at) ? (
            <span className="text-[0.75rem] text-muted">
              {enquiry.last_contacted_at ? `Last contacted ${formatDateOnly(enquiry.last_contacted_at)}` : ''}
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

const NOTE_KIND_META: Record<string, { label: string; icon: typeof StickyNoteIcon; className: string }> = {
  note: { label: 'Note', icon: StickyNoteIcon, className: 'text-ink-700' },
  status_change: { label: 'Status change', icon: HistoryIcon, className: 'text-info-600' },
  follow_up: { label: 'Follow-up', icon: AlarmClockIcon, className: 'text-warning-600' }
};

function NotesSection({
  enquiryId,
  notes,
  onAdded,
  onNotify,
  onUnauthorized
}: {
  enquiryId: string;
  notes: Note[];
  onAdded: (note: Note) => void;
  onNotify: Props['onNotify'];
  onUnauthorized: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    const note = draft.trim();
    if (!note || saving) return;
    setSaving(true);
    setError(null);
    const result = await adminRequest<{ note: Note }>(`/api/admin/enquiries?id=${encodeURIComponent(enquiryId)}&notes=1`, {
      method: 'POST',
      body: JSON.stringify({ note })
    });
    setSaving(false);
    if (result.status === 401) return onUnauthorized();
    if (!result.ok || !result.data) {
      setError(result.error ?? 'The note could not be saved. Your text has been kept.');
      return;
    }
    setDraft('');
    onAdded(result.data.note);
    onNotify('success', 'Note added.');
  };

  const applyTemplate = (template: string) => {
    setDraft((prev) => (prev.trim() ? `${prev.trimEnd()} ${template}` : template));
    textareaRef.current?.focus();
  };

  return (
    <Card>
      <SectionHeading>Internal notes &amp; history</SectionHeading>
      <p className="mt-1 flex items-center gap-1.5 text-[0.75rem] text-muted">
        <LockIcon className="h-3 w-3" aria-hidden={true} />
        Visible to admins only — never shown or sent to the client.
      </p>

      <form onSubmit={add} className="mt-3">
        <label htmlFor="new-note" className="sr-only">
          Add an internal note
        </label>
        <textarea
          id="new-note"
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          maxLength={4000}
          disabled={saving}
          placeholder="e.g. Called Ash — sending a quote for 12 learners by Friday."
          className={inputClass}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5" aria-label="Quick note templates">
            {NOTE_TEMPLATES.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => applyTemplate(template)}
                disabled={saving}
                className="rounded-full border border-hairline bg-white px-2.5 py-1 text-[0.75rem] text-ink-900 hover:bg-[#F4F2F1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50">
                {template.replace(/[:.]?\s*$/, '')}
              </button>
            ))}
          </div>
          <button type="submit" disabled={saving || !draft.trim()} className={primaryButton}>
            {saving ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden={true} /> : null}
            {saving ? 'Saving…' : 'Add note'}
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 text-[0.8125rem] text-error-600">
            {error}
          </p>
        ) : null}
      </form>

      {notes.length === 0 ? (
        <p className="mt-4 border-t border-hairline pt-4 text-[0.8125rem] text-muted">No notes yet.</p>
      ) : (
        <ol className="mt-4 space-y-3 border-t border-hairline pt-4">
          {notes.map((note) => {
            const meta = NOTE_KIND_META[note.kind ?? 'note'] ?? NOTE_KIND_META.note;
            return (
              <li key={note.id} className="flex gap-3">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F4F2F1] ${meta.className}`}>
                  <meta.icon className="h-3.5 w-3.5" aria-hidden={true} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`whitespace-pre-wrap break-words text-[0.875rem] ${note.kind && note.kind !== 'note' ? 'text-muted' : 'text-ink-900'}`}>{note.note}</p>
                  <p className="mt-0.5 text-[0.75rem] text-muted">
                    {meta.label} · <time dateTime={note.created_at} title={formatDateTimeLong(note.created_at)}>{formatDateTime(note.created_at)}</time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
