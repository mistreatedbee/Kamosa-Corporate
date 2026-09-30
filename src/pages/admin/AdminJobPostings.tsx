import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseIcon,
  ChevronDownIcon,
  DownloadIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  XIcon
} from 'lucide-react';
import { Seo } from '../../components/Seo';

interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  location: string;
  employment_type: string;
  summary: string;
  requirements: string[];
  responsibilities: string[];
  status: 'draft' | 'open' | 'closed';
  closing_date: string | null;
  created_at: string;
  application_count: number;
}

interface Application {
  id: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  cover_message: string | null;
  cv_file_name: string;
  cv_url: string | null;
  created_at: string;
}

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const POSTING_STATUSES: JobPosting['status'][] = ['draft', 'open', 'closed'];
const APPLICATION_STATUSES = ['New', 'Reviewed', 'Shortlisted', 'Interviewing', 'Offered', 'Rejected', 'Hired'];

const POSTING_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-cream text-muted',
  open: 'bg-success-50 text-success-600',
  closed: 'bg-error-50 text-error-600'
};

const APPLICATION_STATUS_BADGE: Record<string, string> = {
  New: 'bg-info-50 text-info-600',
  Reviewed: 'bg-info-50 text-info-600',
  Shortlisted: 'bg-warning-50 text-warning-600',
  Interviewing: 'bg-warning-50 text-warning-600',
  Offered: 'bg-success-50 text-success-600',
  Hired: 'bg-success-50 text-success-600',
  Rejected: 'bg-error-50 text-error-600'
};

interface PostingFormValues {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  summary: string;
  requirements: string;
  responsibilities: string;
  status: JobPosting['status'];
  closingDate: string;
}

const EMPTY_FORM: PostingFormValues = {
  title: '',
  department: '',
  location: 'South Africa',
  employmentType: 'Full-time',
  summary: '',
  requirements: '',
  responsibilities: '',
  status: 'draft',
  closingDate: ''
};

export function AdminJobPostings() {
  const [postings, setPostings] = useState<JobPosting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/admin/job-postings', { credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      setError('Could not load job postings.');
      return;
    }
    const data = await response.json();
    setPostings(data.postings);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this job posting? This also deletes any applications submitted to it.')) return;
    const response = await fetch(`/api/admin/job-postings/${id}`, { method: 'DELETE', credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (response.ok) load();
  };

  return (
    <div>
      <Seo title="Careers | Kamosa Admin" description="Kamosa admin job postings." noindex />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-ink-900">Careers</h1>
          <p className="mt-1.5 text-[0.9375rem] text-muted">Create and manage job postings and review applications.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="flex items-center gap-2 rounded-md bg-ink-900 px-3.5 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          {showCreate ? <XIcon className="h-4 w-4" aria-hidden={true} /> : <PlusIcon className="h-4 w-4" aria-hidden={true} />}
          {showCreate ? 'Cancel' : 'New posting'}
        </button>
      </div>

      {showCreate ? (
        <div className="mt-6 rounded-lg border border-hairline bg-white p-6 shadow-card">
          <PostingForm
            initial={EMPTY_FORM}
            submitLabel="Create posting"
            onCancel={() => setShowCreate(false)}
            onSubmit={async (values) => {
              const response = await fetch('/api/admin/job-postings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(values)
              });
              if (response.status === 401) {
                navigate('/admin/login', { replace: true });
                return false;
              }
              if (response.ok) {
                setShowCreate(false);
                load();
                return true;
              }
              return false;
            }} />
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {postings === null && !error ? (
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
            Loading…
          </div>
        ) : null}

        {error ? <div className="rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-error-600 shadow-card">{error}</div> : null}

        {postings && postings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-hairline bg-white px-8 py-16 text-center shadow-card">
            <BriefcaseIcon className="h-8 w-8 text-hairline" aria-hidden={true} />
            <p className="text-[0.9375rem] font-semibold text-ink-900">No job postings yet.</p>
            <p className="max-w-sm text-[0.8125rem] text-muted">Create your first posting to start accepting applications.</p>
          </div>
        ) : null}

        {postings?.map((posting) =>
          editingId === posting.id ? (
            <div key={posting.id} className="rounded-lg border border-hairline bg-white p-6 shadow-card">
              <PostingForm
                initial={{
                  title: posting.title,
                  department: posting.department ?? '',
                  location: posting.location,
                  employmentType: posting.employment_type,
                  summary: posting.summary,
                  requirements: posting.requirements.join('\n'),
                  responsibilities: posting.responsibilities.join('\n'),
                  status: posting.status,
                  closingDate: posting.closing_date ?? ''
                }}
                submitLabel="Save changes"
                onCancel={() => setEditingId(null)}
                onSubmit={async (values) => {
                  const response = await fetch(`/api/admin/job-postings/${posting.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(values)
                  });
                  if (response.status === 401) {
                    navigate('/admin/login', { replace: true });
                    return false;
                  }
                  if (response.ok) {
                    setEditingId(null);
                    load();
                    return true;
                  }
                  return false;
                }} />
            </div>
          ) : (
            <div key={posting.id} className="rounded-lg border border-hairline bg-white shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-4 p-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h2 className="font-display text-base font-bold text-ink-900">{posting.title}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide ${POSTING_STATUS_BADGE[posting.status]}`}>
                      {posting.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] text-muted">
                    {posting.department ? `${posting.department} · ` : ''}
                    {posting.location} · {posting.employment_type}
                  </p>
                  <p className="mt-3 max-w-2xl text-[0.9375rem] text-muted">{posting.summary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(posting.id)}
                    className="rounded-md border border-hairline px-3 py-1.5 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(posting.id)}
                    aria-label={`Delete ${posting.title}`}
                    className="rounded-md border border-hairline p-1.5 text-error-600 transition-colors duration-200 hover:bg-error-50">
                    <Trash2Icon className="h-4 w-4" aria-hidden={true} />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setExpandedId((prev) => (prev === posting.id ? null : posting.id))}
                aria-expanded={expandedId === posting.id}
                className="flex w-full items-center justify-between border-t border-hairline px-6 py-3 text-[0.8125rem] font-medium text-brand-600 transition-colors duration-200 hover:bg-cream/50">
                {posting.application_count} application{posting.application_count === 1 ? '' : 's'}
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 ${expandedId === posting.id ? 'rotate-180' : ''}`}
                  aria-hidden={true} />
              </button>

              {expandedId === posting.id ? (
                <ApplicationsPanel jobPostingId={posting.id} onUnauthorized={() => navigate('/admin/login', { replace: true })} />
              ) : null}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function PostingForm({
  initial,
  submitLabel,
  onCancel,
  onSubmit
}: {
  initial: PostingFormValues;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (values: PostingFormValues) => Promise<boolean>;
}) {
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field = (key: keyof PostingFormValues) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setValues((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.title.trim() || !values.summary.trim()) {
      setError('Title and summary are required.');
      return;
    }
    setError(null);
    setSaving(true);
    const ok = await onSubmit(values);
    setSaving(false);
    if (!ok) setError('Something went wrong. Please try again.');
  };

  const inputClass =
    'mt-1.5 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none';
  const labelClass = 'text-[0.8125rem] font-semibold text-ink-900';

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Title *</label>
        <input type="text" value={values.title} onChange={field('title')} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Department</label>
        <input type="text" value={values.department} onChange={field('department')} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Location</label>
        <input type="text" value={values.location} onChange={field('location')} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Employment type</label>
        <select value={values.employmentType} onChange={field('employmentType')} className={inputClass}>
          {EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass}>Summary *</label>
        <textarea rows={2} value={values.summary} onChange={field('summary')} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Responsibilities</label>
        <textarea
          rows={4}
          value={values.responsibilities}
          onChange={field('responsibilities')}
          placeholder={'One per line'}
          className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Requirements</label>
        <textarea
          rows={4}
          value={values.requirements}
          onChange={field('requirements')}
          placeholder={'One per line'}
          className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select value={values.status} onChange={field('status')} className={inputClass}>
          {POSTING_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Closing date</label>
        <input type="date" value={values.closingDate} onChange={field('closingDate')} className={inputClass} />
      </div>

      {error ? <p className="sm:col-span-2 text-[0.8125rem] text-error-600">{error}</p> : null}

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-hairline px-4 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ApplicationsPanel({ jobPostingId, onUnauthorized }: { jobPostingId: string; onUnauthorized: () => void }) {
  const [applications, setApplications] = useState<Application[] | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/job-postings/${jobPostingId}/applications`, { credentials: 'include' });
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (response.ok) {
      const data = await response.json();
      setApplications(data.applications);
    }
  }, [jobPostingId, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setApplications((prev) => prev?.map((a) => (a.id === id ? { ...a, status } : a)) ?? prev);
    const response = await fetch(`/api/admin/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (!response.ok) load();
  };

  if (applications === null) {
    return (
      <div className="flex items-center gap-2 border-t border-hairline bg-cream/40 p-6 text-[0.875rem] text-muted">
        <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
        Loading applications…
      </div>
    );
  }

  if (applications.length === 0) {
    return <div className="border-t border-hairline bg-cream/40 p-6 text-[0.875rem] text-muted">No applications yet.</div>;
  }

  return (
    <div className="space-y-3 border-t border-hairline bg-cream/40 p-6">
      {applications.map((application) => (
        <div key={application.id} className="rounded-md border border-hairline bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink-900">{application.name}</p>
              <p className="text-[0.8125rem] text-muted">{application.email}</p>
              {application.phone ? <p className="text-[0.8125rem] text-muted">{application.phone}</p> : null}
            </div>
            <div className="flex items-center gap-2">
              {application.cv_url ? (
                <a
                  href={application.cv_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-[0.75rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
                  <DownloadIcon className="h-3.5 w-3.5" aria-hidden={true} />
                  {application.cv_file_name}
                </a>
              ) : null}
              <select
                value={application.status}
                onChange={(event) => updateStatus(application.id, event.target.value)}
                className={`rounded-full border-0 px-2.5 py-1 text-[0.75rem] font-semibold ${APPLICATION_STATUS_BADGE[application.status] ?? 'bg-cream text-muted'}`}>
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {application.cover_message ? (
            <p className="mt-3 border-t border-hairline pt-3 text-[0.875rem] text-muted">{application.cover_message}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
