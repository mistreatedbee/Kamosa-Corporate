import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon, MessageSquarePlusIcon } from 'lucide-react';
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

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  return (
    <div>
      <Seo title="Enquiries | Kamosa Admin" description="Kamosa admin enquiry inbox." noindex />
      <h1 className="font-display text-xl font-bold text-ink-900">Enquiries</h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">
        All submissions from the contact form, quote requests, and service requests. Newest first.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-sm border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-sm border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto border border-hairline bg-white">
        {enquiries === null && !error ? (
          <div className="flex items-center gap-2 p-8 text-[0.9375rem] text-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
            Loading…
          </div>
        ) : null}

        {error ? <div className="p-8 text-[0.9375rem] text-error-600">{error}</div> : null}

        {enquiries && enquiries.length === 0 ? (
          <div className="p-8 text-[0.9375rem] text-muted">No enquiries match this filter.</div>
        ) : null}

        {enquiries && enquiries.length > 0 ? (
          <table className="w-full min-w-[960px] text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-hairline bg-cream text-[0.75rem] font-bold uppercase tracking-[0.1em] text-muted">
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <Fragment key={enquiry.id}>
                  <tr className="border-b border-hairline align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {new Date(enquiry.created_at).toLocaleString('en-ZA', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink-900">{enquiry.name}</td>
                    <td className="px-4 py-3 text-muted">{enquiry.company_name || '—'}</td>
                    <td className="px-4 py-3 text-muted">
                      <div>{enquiry.email}</div>
                      {enquiry.phone ? <div>{enquiry.phone}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-muted">{enquiry.type}</td>
                    <td className="px-4 py-3 text-muted">{enquiry.service_slug || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={enquiry.status}
                        onChange={(event) => updateStatus(enquiry.id, event.target.value)}
                        className={`rounded-sm border-0 px-2 py-1 text-[0.75rem] font-semibold ${STATUS_BADGE[enquiry.status] ?? 'bg-cream text-muted'}`}>
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
                      <td colSpan={9} className="px-4 py-4">
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
