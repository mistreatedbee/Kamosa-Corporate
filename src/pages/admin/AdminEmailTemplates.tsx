import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon, MailIcon } from 'lucide-react';
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
  job_application: 'Job application'
};

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
        Customize the subject and intro line of each notification email. Use{' '}
        <code className="rounded-sm bg-cream px-1.5 py-0.5 text-[0.8125rem]">{'{{role}}'}</code> in the job application
        template to insert the role title.
      </p>

      {templates === null && !error ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
          <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
          Loading…
        </div>
      ) : null}

      {error ? <div className="mt-6 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-error-600 shadow-card">{error}</div> : null}

      <div className="mt-6 space-y-4">
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
  const [error, setError] = useState<string | null>(null);

  const dirty = subject !== template.subject || intro !== template.intro;

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

  return (
    <div className="rounded-lg border border-hairline bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MailIcon className="h-4 w-4 text-brand-600" aria-hidden={true} />
          <h2 className="font-display text-[0.875rem] font-bold text-ink-900">{TYPE_LABELS[template.type] ?? template.type}</h2>
        </div>
        {template.isCustom ? (
          <span className="rounded-full bg-success-50 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-success-600">
            Customized
          </span>
        ) : (
          <span className="rounded-full bg-cream px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-muted">Default</span>
        )}
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <label className="text-[0.8125rem] font-semibold text-ink-900">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-1.5 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
        </div>
        <div>
          <label className="text-[0.8125rem] font-semibold text-ink-900">Intro line (optional)</label>
          <textarea
            rows={2}
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
            placeholder="A short line shown above the details table."
            className="mt-1.5 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
        </div>
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
  );
}
