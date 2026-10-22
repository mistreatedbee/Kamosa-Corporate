import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BriefcaseIcon,
  ChevronDownIcon,
  DownloadIcon,
  Loader2Icon,
  MessageSquarePlusIcon,
  PlusIcon,
  SearchIcon
} from 'lucide-react';
import { Seo } from '../../components/Seo';
import { JobPostingWizard, EMPTY_WIZARD_VALUES, type WizardValues } from '../../components/admin/JobPostingWizard';
import { SuggestionChips } from '../../components/SuggestionChips';
import { APPLICATION_NOTE_TEMPLATES } from '../../data/formSuggestions';
import { POSTING_STATUSES, POSTING_STATUS_LABELS, type AdminJobPosting, type PostingStatus } from '../../types/careers';

interface Note {
  id: string;
  note: string;
  created_at: string;
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
  documents: Array<{ type: string; fileName: string; url: string | null }>;
  answers: Array<{ questionId: string; label: string; answer: string }>;
  reference_code: string;
  created_at: string;
}

const APPLICATION_STATUSES = ['New', 'Reviewed', 'Shortlisted', 'Interviewing', 'Offered', 'Rejected', 'Hired', 'Withdrawn'];

const POSTING_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-cream text-muted',
  open: 'bg-success-50 text-success-600',
  paused: 'bg-warning-50 text-warning-600',
  closed: 'bg-error-50 text-error-600',
  archived: 'bg-cream text-muted'
};

const APPLICATION_STATUS_BADGE: Record<string, string> = {
  New: 'bg-info-50 text-info-600',
  Reviewed: 'bg-info-50 text-info-600',
  Shortlisted: 'bg-warning-50 text-warning-600',
  Interviewing: 'bg-warning-50 text-warning-600',
  Offered: 'bg-success-50 text-success-600',
  Hired: 'bg-success-50 text-success-600',
  Rejected: 'bg-error-50 text-error-600',
  Withdrawn: 'bg-cream text-muted'
};

function postingToWizardValues(posting: AdminJobPosting): WizardValues {
  return {
    title: posting.title,
    department: posting.department ?? '',
    location: posting.location,
    category: posting.category ?? '',
    industry: posting.industry ?? '',
    vacancies: String(posting.vacancies),
    summary: posting.summary,
    responsibilities: posting.responsibilities,
    employmentType: posting.employment_type,
    workArrangement: posting.work_arrangement,
    requirements: posting.requirements,
    preferredRequirements: posting.preferred_requirements,
    qualifications: posting.qualifications,
    minExperienceYears: posting.min_experience_years ? String(posting.min_experience_years) : '',
    educationLevel: posting.education_level ?? '',
    languages: posting.languages,
    salaryMin: posting.salary_min ? String(posting.salary_min) : '',
    salaryMax: posting.salary_max ? String(posting.salary_max) : '',
    salaryCurrency: posting.salary_currency,
    salaryFrequency: posting.salary_frequency ?? 'Monthly',
    salaryPublic: posting.salary_public,
    salaryNegotiable: posting.salary_negotiable,
    benefits: posting.benefits,
    workingHours: posting.working_hours ?? '',
    startDate: posting.start_date ?? '',
    opensAt: posting.opens_at ?? '',
    closingDate: posting.closing_date ?? '',
    requiredDocuments: posting.required_documents,
    screeningQuestions: posting.screening_questions,
    applicationMethod: posting.application_method,
    applicationEmail: posting.application_email ?? '',
    applicationUrl: posting.application_url ?? '',
    applicationInstructions: posting.application_instructions ?? '',
    recruiterName: posting.recruiter_name ?? '',
    recruiterEmail: posting.recruiter_email ?? '',
    recruiterPhone: posting.recruiter_phone ?? ''
  };
}

function wizardValuesToBody(values: WizardValues, status: PostingStatus) {
  return {
    title: values.title.trim(),
    department: values.department,
    location: values.location,
    category: values.category,
    industry: values.industry,
    vacancies: Number(values.vacancies) || 1,
    summary: values.summary.trim(),
    responsibilities: values.responsibilities,
    employmentType: values.employmentType,
    workArrangement: values.workArrangement,
    requirements: values.requirements,
    preferredRequirements: values.preferredRequirements,
    qualifications: values.qualifications,
    minExperienceYears: values.minExperienceYears ? Number(values.minExperienceYears) : null,
    educationLevel: values.educationLevel,
    languages: values.languages,
    salaryMin: values.salaryNegotiable ? null : values.salaryMin ? Number(values.salaryMin) : null,
    salaryMax: values.salaryNegotiable ? null : values.salaryMax ? Number(values.salaryMax) : null,
    salaryCurrency: values.salaryCurrency,
    salaryFrequency: values.salaryNegotiable ? null : values.salaryFrequency,
    salaryPublic: values.salaryPublic,
    salaryNegotiable: values.salaryNegotiable,
    benefits: values.benefits,
    workingHours: values.workingHours,
    startDate: values.startDate || null,
    opensAt: values.opensAt || null,
    closingDate: values.closingDate || null,
    requiredDocuments: values.requiredDocuments,
    screeningQuestions: values.screeningQuestions,
    applicationMethod: values.applicationMethod,
    applicationEmail: values.applicationEmail,
    applicationUrl: values.applicationUrl,
    applicationInstructions: values.applicationInstructions,
    recruiterName: values.recruiterName,
    recruiterEmail: values.recruiterEmail,
    recruiterPhone: values.recruiterPhone,
    status
  };
}

export function AdminJobPostings() {
  const [postings, setPostings] = useState<AdminJobPosting[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<{ kind: 'list' } | { kind: 'create' } | { kind: 'edit'; posting: AdminJobPosting }>({ kind: 'list' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');

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

  const categories = useMemo(
    () => Array.from(new Set((postings ?? []).map((p) => p.category).filter((c): c is string => Boolean(c)))),
    [postings]
  );

  const visiblePostings = useMemo(() => {
    let list = postings ?? [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q));
    }
    if (statusFilter) list = list.filter((p) => p.status === statusFilter);
    if (categoryFilter) list = list.filter((p) => p.category === categoryFilter);
    return [...list].sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === 'newest' ? -diff : diff;
    });
  }, [postings, search, statusFilter, categoryFilter, sort]);

  const saveDraft = async (values: WizardValues, editingId?: string) => {
    const body = wizardValuesToBody(values, 'draft');
    const response = editingId
      ? await fetch(`/api/admin/job-postings?id=${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        })
      : await fetch('/api/admin/job-postings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return false;
    }
    if (response.ok) {
      setMode({ kind: 'list' });
      load();
      return true;
    }
    return false;
  };

  const publish = async (values: WizardValues, editingId?: string) => {
    const body = wizardValuesToBody(values, 'open');
    const response = editingId
      ? await fetch(`/api/admin/job-postings?id=${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        })
      : await fetch('/api/admin/job-postings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body)
        });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return false;
    }
    if (response.ok) {
      setMode({ kind: 'list' });
      load();
      return true;
    }
    return false;
  };

  const setStatus = async (id: string, status: PostingStatus) => {
    const response = await fetch(`/api/admin/job-postings?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status })
    });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (response.ok) load();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This also deletes any applications submitted to it. This cannot be undone.`)) return;
    const response = await fetch(`/api/admin/job-postings?id=${id}`, { method: 'DELETE', credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (response.ok) load();
  };

  if (mode.kind === 'create') {
    return (
      <div>
        <Seo title="New Job Posting | Kamosa Admin" description="Create a job posting." noindex />
        <h1 className="font-display text-xl font-bold text-ink-900">New Job Posting</h1>
        <div className="mt-6">
          <JobPostingWizard
            initial={EMPTY_WIZARD_VALUES}
            onCancel={() => setMode({ kind: 'list' })}
            onSaveDraft={(values) => saveDraft(values)}
            onPublish={(values) => publish(values)}
          />
        </div>
      </div>
    );
  }

  if (mode.kind === 'edit') {
    return (
      <div>
        <Seo title="Edit Job Posting | Kamosa Admin" description="Edit a job posting." noindex />
        <h1 className="font-display text-xl font-bold text-ink-900">Edit: {mode.posting.title}</h1>
        <div className="mt-6">
          <JobPostingWizard
            initial={postingToWizardValues(mode.posting)}
            onCancel={() => setMode({ kind: 'list' })}
            onSaveDraft={(values) => saveDraft(values, mode.posting.id)}
            onPublish={(values) => publish(values, mode.posting.id)}
          />
        </div>
      </div>
    );
  }

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
          onClick={() => setMode({ kind: 'create' })}
          className="flex items-center gap-2 rounded-md bg-ink-900 px-3.5 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          <PlusIcon className="h-4 w-4" aria-hidden={true} />
          New posting
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-white p-3 shadow-card">
        <div className="relative min-w-[200px] flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden={true} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or category…"
            className="w-full rounded-md border border-hairline bg-white py-2 pl-9 pr-3 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          <option value="">All statuses</option>
          {POSTING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {POSTING_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {categories.length > 0 ? (
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        ) : null}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>
      </div>

      <div className="mt-6 space-y-4">
        {postings === null && !error ? (
          <div className="flex items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
            Loading…
          </div>
        ) : null}

        {error ? <div className="rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-error-600 shadow-card">{error}</div> : null}

        {postings && visiblePostings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-hairline bg-white px-8 py-16 text-center shadow-card">
            <BriefcaseIcon className="h-8 w-8 text-hairline" aria-hidden={true} />
            <p className="text-[0.9375rem] font-semibold text-ink-900">
              {postings.length === 0 ? 'No job postings yet.' : 'No postings match this filter.'}
            </p>
            <p className="max-w-sm text-[0.8125rem] text-muted">
              {postings.length === 0 ? 'Create your first posting to start accepting applications.' : 'Try clearing the filters above.'}
            </p>
          </div>
        ) : null}

        {visiblePostings.map((posting) => (
          <div key={posting.id} className="rounded-lg border border-hairline bg-white shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4 p-6">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-display text-base font-bold text-ink-900">{posting.title}</h2>
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide ${POSTING_STATUS_BADGE[posting.status]}`}>
                    {POSTING_STATUS_LABELS[posting.status]}
                  </span>
                </div>
                <p className="mt-1.5 text-[0.8125rem] text-muted">
                  {posting.category ? `${posting.category} · ` : ''}
                  {posting.work_arrangement === 'remote' ? 'Remote' : posting.location} · {posting.employment_type}
                </p>
                <p className="mt-3 max-w-2xl text-[0.9375rem] text-muted">{posting.summary}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode({ kind: 'edit', posting })}
                  className="rounded-md border border-hairline px-3 py-1.5 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
                  Edit
                </button>
                <PostingLifecycleActions status={posting.status} onChange={(status) => setStatus(posting.id, status)} />
                <button
                  type="button"
                  onClick={() => handleDelete(posting.id, posting.title)}
                  aria-label={`Delete ${posting.title}`}
                  className="rounded-md border border-hairline p-1.5 text-error-600 transition-colors duration-200 hover:bg-error-50">
                  ×
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
        ))}
      </div>
    </div>
  );
}

function PostingLifecycleActions({ status, onChange }: { status: PostingStatus; onChange: (status: PostingStatus) => void }) {
  const actions: Array<{ label: string; next: PostingStatus; style: string }> = [];
  if (status === 'draft') actions.push({ label: 'Publish', next: 'open', style: 'bg-success-600 text-white hover:bg-success-600/90' });
  if (status === 'open') actions.push({ label: 'Pause', next: 'paused', style: 'border border-hairline text-ink-900 hover:bg-cream' });
  if (status === 'open') actions.push({ label: 'Close', next: 'closed', style: 'border border-hairline text-ink-900 hover:bg-cream' });
  if (status === 'paused') actions.push({ label: 'Reopen', next: 'open', style: 'bg-success-600 text-white hover:bg-success-600/90' });
  if (status === 'paused') actions.push({ label: 'Close', next: 'closed', style: 'border border-hairline text-ink-900 hover:bg-cream' });
  if (status === 'closed') actions.push({ label: 'Reopen', next: 'open', style: 'bg-success-600 text-white hover:bg-success-600/90' });
  if (status !== 'archived') actions.push({ label: 'Archive', next: 'archived', style: 'border border-hairline text-muted hover:bg-cream' });
  if (status === 'archived') actions.push({ label: 'Restore to draft', next: 'draft', style: 'border border-hairline text-ink-900 hover:bg-cream' });

  return (
    <>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={() => onChange(action.next)}
          className={`rounded-md px-3 py-1.5 text-[0.8125rem] font-medium transition-colors duration-200 ${action.style}`}>
          {action.label}
        </button>
      ))}
    </>
  );
}

function ApplicationsPanel({ jobPostingId, onUnauthorized }: { jobPostingId: string; onUnauthorized: () => void }) {
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/job-postings?id=${jobPostingId}&applications=1`, { credentials: 'include' });
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
              <p className="font-semibold text-ink-900">
                {application.name} <span className="font-mono text-[0.75rem] font-normal text-muted">{application.reference_code}</span>
              </p>
              <p className="text-[0.8125rem] text-muted">{application.email}</p>
              {application.phone ? <p className="text-[0.8125rem] text-muted">{application.phone}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              {application.documents.map((doc) =>
                doc.url ? (
                  <a
                    key={doc.fileName}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-md border border-hairline px-2.5 py-1.5 text-[0.75rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
                    <DownloadIcon className="h-3.5 w-3.5" aria-hidden={true} />
                    {doc.fileName}
                  </a>
                ) : null
              )}
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
              <button
                type="button"
                onClick={() => setExpandedAppId((prev) => (prev === application.id ? null : application.id))}
                className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-brand-600 hover:underline">
                <MessageSquarePlusIcon className="h-3.5 w-3.5" aria-hidden={true} />
                Notes
              </button>
            </div>
          </div>
          {application.cover_message ? (
            <p className="mt-3 border-t border-hairline pt-3 text-[0.875rem] text-muted">{application.cover_message}</p>
          ) : null}
          {application.answers.length > 0 ? (
            <dl className="mt-3 space-y-1.5 border-t border-hairline pt-3">
              {application.answers.map((a) => (
                <div key={a.questionId} className="text-[0.8125rem]">
                  <dt className="font-semibold text-ink-900">{a.label}</dt>
                  <dd className="text-muted">{a.answer}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {expandedAppId === application.id ? (
            <ApplicationNotesPanel applicationId={application.id} onUnauthorized={onUnauthorized} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ApplicationNotesPanel({ applicationId, onUnauthorized }: { applicationId: string; onUnauthorized: () => void }) {
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    const response = await fetch(`/api/admin/job-postings?applicationId=${applicationId}&notes=1`, { credentials: 'include' });
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (response.ok) {
      const data = await response.json();
      setNotes(data.notes);
    }
  }, [applicationId, onUnauthorized]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const addNote = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    const response = await fetch(`/api/admin/job-postings?applicationId=${applicationId}&notes=1`, {
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
    <div className="mt-3 border-t border-hairline pt-3">
      <h4 className="font-display text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink-900">Internal notes</h4>
      {notes === null ? (
        <p className="mt-2 text-[0.8125rem] text-muted">Loading…</p>
      ) : notes.length === 0 ? (
        <p className="mt-2 text-[0.8125rem] text-muted">No notes yet.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-sm border border-hairline bg-cream/40 p-2.5">
              <p className="text-[0.8125rem] text-ink-900">{note.note}</p>
              <p className="mt-1 text-[0.6875rem] text-muted">
                {new Date(note.created_at).toLocaleString('en-ZA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          placeholder="Add a note…"
          className="flex-1 rounded-sm border border-hairline bg-white px-3 py-2 text-[0.8125rem] text-ink-900 focus:border-brand-600" />
        <button
          type="button"
          onClick={addNote}
          disabled={saving || !draft.trim()}
          className="shrink-0 rounded-sm bg-ink-900 px-3 py-2 text-[0.75rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving…' : 'Add'}
        </button>
      </div>
      <div className="mt-2">
        <SuggestionChips
          label="Quick note templates"
          options={APPLICATION_NOTE_TEMPLATES}
          onSelect={(v) => setDraft((prev) => (prev.trim() ? `${prev.trimEnd()} ${v}` : v))}
          disabled={saving}
        />
      </div>
    </div>
  );
}
