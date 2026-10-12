import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { Seo } from '../../components/Seo';

interface Settings {
  notificationRecipientEmail: string;
  emailNotificationsConfigured: boolean;
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/admin/tools?resource=settings', { credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      setError('Could not load settings.');
      return;
    }
    const data = await response.json();
    setSettings(data);
    setEmail(data.notificationRecipientEmail);
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);
    const response = await fetch('/api/admin/tools?resource=settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ notificationRecipientEmail: email })
    });
    setSaving(false);
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (response.ok) {
      setSaved(true);
      load();
    } else {
      setError('Could not save. Please check the email address and try again.');
    }
  };

  return (
    <div>
      <Seo title="Settings | Kamosa Admin" description="Kamosa admin settings." noindex />
      <h1 className="font-display text-xl font-bold text-ink-900">Settings</h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">Notification preferences for the admin inbox.</p>

      {settings === null && !error ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
          <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
          Loading…
        </div>
      ) : null}

      {settings ? (
        <div className="mt-6 max-w-lg rounded-lg border border-hairline bg-white p-6 shadow-card">
          <div className="flex items-center gap-2.5 text-[0.8125rem]">
            {settings.emailNotificationsConfigured ? (
              <>
                <CheckCircle2Icon className="h-4 w-4 text-success-600" aria-hidden={true} />
                <span className="font-medium text-ink-900">Email notifications are configured and active.</span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-4 w-4 text-muted" aria-hidden={true} />
                <span className="font-medium text-ink-900">Email notifications are not yet configured (RESEND_API_KEY is not set).</span>
              </>
            )}
          </div>

          <div className="mt-6">
            <label className="text-[0.8125rem] font-semibold text-ink-900">Notification recipient email</label>
            <p className="mt-1 text-[0.75rem] text-muted">
              Every enquiry, quote request, service request, and job application notification is sent here.
            </p>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none" />
          </div>

          {error ? <p className="mt-3 text-[0.8125rem] text-error-600">{error}</p> : null}
          {saved && !error ? <p className="mt-3 text-[0.8125rem] text-success-600">Saved.</p> : null}

          <div className="mt-5">
            <button
              type="button"
              onClick={save}
              disabled={saving || email === settings.notificationRecipientEmail}
              className="rounded-md bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
