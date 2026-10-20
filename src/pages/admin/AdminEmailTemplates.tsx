import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon, MailIcon, RotateCcwIcon } from 'lucide-react';
import { Seo } from '../../components/Seo';

interface Template {
  type: string;
  subject: string;
  intro: string;
  isCustom: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  enquiry: 'Contact form enquiry',
  quote_request: 'Quote request',
  service_request: 'Service request',
  job_application: 'Job application',
  application_status_update: 'Applicant status update'
};

// Realistic sample data so the live preview shows exactly what an admin will actually receive,
// not an abstract placeholder — the single biggest readability win for a non-technical user
// editing a subject/intro line blind. Mirrors the real field set each endpoint sends in
// api/enquiry.ts, api/quote-request.ts, api/service-request.ts, and api/careers.ts.
const SAMPLE_LINES: Record<string, Array<{ label: string; value: string }>> = {
  enquiry: [
    { label: 'Name', value: 'Thabo Nkosi' },
    { label: 'Company', value: 'Acme Mining (Pty) Ltd' },
    { label: 'Email', value: 'thabo@acmemining.co.za' },
    { label: 'Phone', value: '082 123 4567' },
    { label: 'Service', value: 'Health & Safety Compliance' },
    { label: 'Message', value: 'We need a site safety audit for our Johannesburg plant.' }
  ],
  quote_request: [
    { label: 'Name', value: 'Lerato Dube' },
    { label: 'Company', value: 'Dube Construction' },
    { label: 'Email', value: 'lerato@dubeconstruction.co.za' },
    { label: 'Phone', value: '071 987 6543' },
    { label: 'Service', value: 'training' },
    { label: 'Category', value: 'training' }
  ],
  service_request: [
    { label: 'Name', value: 'Sipho Khumalo' },
    { label: 'Email', value: 'sipho@example.com' },
    { label: 'Phone', value: '083 555 1234' },
    { label: 'Service', value: 'procurement' },
    { label: 'Description', value: 'Looking for PPE supply for a 40-person team.' }
  ],
  job_application: [
    { label: 'Role', value: 'Site Safety Officer' },
    { label: 'Name', value: 'Naledi Mokoena' },
    { label: 'Email', value: 'naledi@example.com' },
    { label: 'Phone', value: '079 222 3344' },
    { label: 'Cover message', value: 'I have 5 years experience in construction site safety.' },
    { label: 'CV', value: 'naledi_mokoena_cv.pdf' }
  ],
  application_status_update: [
    { label: 'Role', value: 'Site Safety Officer' },
    { label: 'Status', value: 'Offered' }
  ]
};

const SAMPLE_VARS: Record<string, Record<string, string>> = {
  job_application: { role: 'Site Safety Officer' },
  application_status_update: { name: 'Naledi Mokoena', role: 'Site Safety Officer', status: 'Offered' }
};

function substitute(text: string, vars: Record<string, string> | undefined): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
}

export function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/admin/tools?resource=email-templates', { credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      setError('Could not load email templates.');
      return;
    }
    const data = await response.json();
    setTemplates(data.templates);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <Seo title="Email Templates | Kamosa Admin" description="Kamosa admin email templates." noindex />
      <h1 className="font-display text-xl font-bold text-ink-900">Email Templates</h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">
        Customize the subject and intro line of each notification email. The preview on the right shows exactly
        what you'll receive, with realistic example details filled in.
      </p>

      {templates === null && !error ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
          <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
          Loading…
        </div>
      ) : null}

      {error ? <div className="mt-6 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-error-600 shadow-card">{error}</div> : null}

      <div className="mt-6 space-y-6">
        {templates?.map((template) => (
          <TemplateCard
            key={template.type}
            template={template}
            onUnauthorized={() => navigate('/admin/login', { replace: true })}
            onSaved={load}
          />
        ))}
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onUnauthorized,
  onSaved
}: {
  template: Template;
  onUnauthorized: () => void;
  onSaved: () => void;
}) {
  const [subject, setSubject] = useState(template.subject);
  const [intro, setIntro] = useState(template.intro);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = subject !== template.subject || intro !== template.intro;
  const vars = SAMPLE_VARS[template.type];
  const previewSubject = substitute(subject || '(no subject)', vars);
  const previewIntro = intro ? substitute(intro, vars) : null;
  const sampleLines = SAMPLE_LINES[template.type] ?? [];

  const save = async () => {
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }
    setError(null);
    setSaving(true);
    const response = await fetch(`/api/admin/tools?resource=email-templates&type=${template.type}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subject, intro })
    });
    setSaving(false);
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (response.ok) {
      onSaved();
    } else {
      setError('Could not save. Please try again.');
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset this template to the default subject and intro?')) return;
    setError(null);
    setResetting(true);
    const response = await fetch(`/api/admin/tools?resource=email-templates&type=${template.type}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    setResetting(false);
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (response.ok) {
      onSaved();
    } else {
      setError('Could not reset. Please try again.');
    }
  };

  return (
    <div className="rounded-lg border border-hairline bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-hairline p-5">
        <div className="flex items-center gap-2.5">
          <MailIcon className="h-4 w-4 text-brand-600" aria-hidden={true} />
          <h2 className="font-display text-[0.875rem] font-bold text-ink-900">{TYPE_LABELS[template.type] ?? template.type}</h2>
        </div>
        <div className="flex items-center gap-2.5">
          {template.isCustom ? (
            <button
              type="button"
              onClick={reset}
              disabled={resetting}
              className="flex items-center gap-1.5 text-[0.75rem] font-medium text-muted transition-colors duration-200 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-50">
              <RotateCcwIcon className="h-3.5 w-3.5" aria-hidden={true} />
              {resetting ? 'Resetting…' : 'Reset to default'}
            </button>
          ) : null}
          {template.isCustom ? (
            <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-success-600">
              Customized
            </span>
          ) : (
            <span className="rounded-full bg-cream px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">Default</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        <div>
          <div>
            <label className="text-[0.8125rem] font-semibold text-ink-900">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1.5 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
            {template.type === 'job_application' ? (
              <p className="mt-1.5 text-[0.75rem] text-muted">
                Type <code className="rounded-sm bg-cream px-1 py-0.5">{'{{role}}'}</code> anywhere you want the job
                title to appear automatically — see the preview.
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <label className="text-[0.8125rem] font-semibold text-ink-900">Intro line (optional)</label>
            <textarea
              rows={2}
              value={intro}
              onChange={(event) => setIntro(event.target.value)}
              placeholder="A short line shown above the details table."
              className="mt-1.5 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
          </div>

          {error ? <p className="mt-3 text-[0.8125rem] text-error-600">{error}</p> : null}

          <div className="mt-4">
            <button
              type="button"
              onClick={save}
              disabled={saving || !dirty}
              className="rounded-md bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted">Live preview</p>
          <div className="rounded-md border border-hairline bg-cream/40 p-4">
            <p className="font-display text-[0.9375rem] font-bold text-ink-900">{previewSubject}</p>
            {previewIntro ? <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-900">{previewIntro}</p> : null}
            <table className="mt-3 w-full border-collapse text-[0.8125rem]">
              <tbody>
                {sampleLines.map((line) => (
                  <tr key={line.label}>
                    <td className="py-1 pr-3 align-top font-semibold text-ink-900">{line.label}</td>
                    <td className="py-1 align-top text-muted">{line.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
