import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  ClockIcon,
  DownloadIcon,
  InboxIcon,
  Loader2Icon,
  MessageSquarePlusIcon,
  SearchIcon,
  SparklesIcon
} from 'lucide-react';
import { Seo } from '../../components/Seo';

interface Enquiry {
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
}

interface Note {
  id: string;
  note: string;
  created_at: string;
}

const TYPE_OPTIONS = [
{ value: '', label: 'All types' },
{ value: 'general', label: 'General' },
{ value: 'quote_hs', label: 'Quote — Health & Safety' },
{ value: 'quote_training', label: 'Quote — Training' },
{ value: 'quote_procurement', label: 'Quote — Procurement' },
{ value: 'service_request', label: 'Service Request' }];


const STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Closed', 'Spam'];

const STATUS_FILTER_OPTIONS = [{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))];

const STATUS_BADGE: Record<string, string> = {
  New: 'bg-info-50 text-info-600',
  Contacted: 'bg-info-50 text-info-600',
  Qualified: 'bg-warning-50 text-warning-600',
  'In Progress': 'bg-warning-50 text-warning-600',
  Converted: 'bg-success-50 text-success-600',
  Closed: 'bg-cream text-muted',
  Spam: 'bg-error-50 text-error-600'
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

function toCsvValue(value: string | null) {
  const safe = (value ?? '').replace(/"/g, '""');
  return `"${safe}"`;
}

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'newest' | 'oldest'>('newest');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);

    const response = await fetch(`/api/admin/enquiries?${params.toString()}`, { credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      setError('Could not load enquiries.');
      return;
    }
    const data = await response.json();
    setEnquiries(data.enquiries);
  }, [typeFilter, statusFilter, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setEnquiries((prev) => prev?.map((e) => (e.id === id ? { ...e, status } : e)) ?? prev);
    const response = await fetch(`/api/admin/enquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      // Revert on failure by reloading the real state from the server.
      load();
    }
  };

  const stats = useMemo(() => {
    const list = enquiries ?? [];
    return {
      total: list.length,
      new: list.filter((e) => e.status === 'New').length,
      active: list.filter((e) => e.status === 'Contacted' || e.status === 'Qualified' || e.status === 'In Progress').length,
      converted: list.filter((e) => e.status === 'Converted').length
    };
  }, [enquiries]);

  const visibleEnquiries = useMemo(() => {
    let list = enquiries ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        [e.name, e.email, e.company_name, e.message].some((field) => field?.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'newest' ? -diff : diff;
    });
  }, [enquiries, search, sortDir]);

  const exportCsv = () => {
    const rows = [
      ['Received', 'Name', 'Company', 'Email', 'Phone', 'Type', 'Service', 'Status', 'Message'],
      ...visibleEnquiries.map((e) => [
        new Date(e.created_at).toLocaleString('en-ZA'),
        e.name,
        e.company_name ?? '',
        e.email,
        e.phone ?? '',
        e.type,
        e.service_slug ?? '',
        e.status,
        e.message ?? ''
      ])
    ];
    const csv = rows.map((row) => row.map(toCsvValue).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kamosa-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Seo title="Enquiries | Kamosa Admin" description="Kamosa admin enquiry inbox." noindex />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Enquiries</h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted">
            All submissions from the contact form, quote requests, and service requests.
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={!enquiries || enquiries.length === 0}
          className="flex items-center gap-2 rounded-md border border-hairline bg-white px-3.5 py-2 text-[0.8125rem] font-semibold text-ink-900 shadow-card transition-colors duration-200 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          <DownloadIcon className="h-4 w-4" aria-hidden={true} />
          Export CSV
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={InboxIcon} label="Total" value={stats.total} accent="text-ink-900" />
        <StatCard icon={SparklesIcon} label="New" value={stats.new} accent="text-info-600" />
        <StatCard icon={ClockIcon} label="In progress" value={stats.active} accent="text-warning-600" />
        <StatCard icon={CheckCircle2Icon} label="Converted" value={stats.converted} accent="text-success-600" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-white p-3 shadow-card">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden={true} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, company, message…"
            className="w-full rounded-md border border-hairline bg-white py-2 pl-9 pr-3 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSortDir((prev) => (prev === 'newest' ? 'oldest' : 'newest'))}
          className="flex items-center gap-1.5 rounded-md border border-hairline bg-white px-3 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
          {sortDir === 'newest' ? <ArrowDownIcon className="h-3.5 w-3.5" aria-hidden={true} /> : <ArrowUpIcon className="h-3.5 w-3.5" aria-hidden={true} />}
          {sortDir === 'newest' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-hairline bg-white shadow-card">
        {enquiries === null && !error ? (
          <div className="flex items-center gap-2 p-8 text-[0.9375rem] text-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
            Loading…
          </div>
        ) : null}

        {error ? <div className="p-8 text-[0.9375rem] text-error-600">{error}</div> : null}

        {enquiries && visibleEnquiries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
            <InboxIcon className="h-8 w-8 text-hairline" aria-hidden={true} />
            <p className="text-[0.9375rem] font-semibold text-ink-900">
              {typeFilter || statusFilter || search ? 'No enquiries match this filter.' : 'No enquiries yet.'}
            </p>
            <p className="max-w-sm text-[0.8125rem] text-muted">
              {typeFilter || statusFilter || search
                ? 'Try clearing the filters or search above to see all submissions.'
                : 'Submissions from the contact form, quote requests, and service requests will appear here as soon as someone gets in touch.'}
            </p>
          </div>
        ) : null}

        {enquiries && visibleEnquiries.length > 0 ? (
          <table className="w-full min-w-[980px] text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-hairline bg-cream/60 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-muted">
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visibleEnquiries.map((enquiry) => (
                <Fragment key={enquiry.id}>
                  <tr className="border-b border-hairline align-top transition-colors duration-150 hover:bg-cream/30">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(enquiry.created_at).toLocaleString('en-ZA', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-[0.6875rem] font-bold text-white">
                          {initials(enquiry.name)}
                        </span>
                        <div>
                          <div className="font-semibold text-ink-900">{enquiry.name}</div>
                          <div className="text-[0.8125rem] text-muted">{enquiry.email}</div>
                          {enquiry.phone ? <div className="text-[0.8125rem] text-muted">{enquiry.phone}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{enquiry.company_name || '—'}</td>
                    <td className="px-4 py-3 text-muted">{enquiry.type}</td>
                    <td className="px-4 py-3 text-muted">{enquiry.service_slug || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={enquiry.status}
                        onChange={(event) => updateStatus(enquiry.id, event.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-[0.75rem] font-semibold ${STATUS_BADGE[enquiry.status] ?? 'bg-cream text-muted'}`}>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted">{enquiry.message || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId((prev) => (prev === enquiry.id ? null : enquiry.id))}
                        className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                        <MessageSquarePlusIcon className="h-3.5 w-3.5" aria-hidden={true} />
                        {expandedId === enquiry.id ? 'Hide' : 'Notes'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === enquiry.id ? (
                    <tr className="border-b border-hairline bg-cream">
                      <td colSpan={8} className="px-4 py-4">
                        <NotesPanel enquiryId={enquiry.id} onUnauthorized={() => navigate('/admin/login', { replace: true })} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent
}: {
  icon: typeof InboxIcon;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-hairline bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} aria-hidden={true} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

function NotesPanel({ enquiryId, onUnauthorized }: { enquiryId: string; onUnauthorized: () => void }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    const response = await fetch(`/api/admin/enquiries/${enquiryId}/notes`, { credentials: 'include' });
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (response.ok) {
      const data = await response.json();
      setNotes(data.notes);
    }
  }, [enquiryId, onUnauthorized]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const addNote = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const response = await fetch(`/api/admin/enquiries/${enquiryId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ note: draft.trim() })
    });
    setSaving(false);
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (response.ok) {
      setDraft('');
      loadNotes();
    }
  };

  return (
    <div className="max-w-xl">
      <h3 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">
        Internal notes
      </h3>

      {notes === null ? (
        <p className="mt-3 text-[0.8125rem] text-muted">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="mt-3 text-[0.8125rem] text-muted">No notes yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {notes.map((note) => (
            <li key={note.id} className="border border-hairline bg-white p-3">
              <p className="text-[0.875rem] text-ink-900">{note.note}</p>
              <p className="mt-1 text-[0.75rem] text-muted">
                {new Date(note.created_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="flex-1 rounded-sm border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600" />
        <button
          type="button"
          onClick={addNote}
          disabled={saving || !draft.trim()}
          className="shrink-0 rounded-sm bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          {saving ? 'Saving…' : 'Add'}
        </button>
      </div>
    </div>
  );
}
