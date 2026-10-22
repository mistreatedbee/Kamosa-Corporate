import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2Icon, Loader2Icon, SendIcon, ShieldCheckIcon, ShieldOffIcon, XCircleIcon } from 'lucide-react';
import { Seo } from '../../components/Seo';

const inputClass =
  'mt-1.5 w-full rounded-md border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900 focus:border-brand-600 focus:outline-none';
const labelClass = 'text-[0.8125rem] font-semibold text-ink-900';
const helpClass = 'mt-1 text-[0.75rem] text-muted';

const NOTIFICATION_CATEGORY_LABELS: Record<string, string> = {
  enquiry: 'General enquiries',
  quote_request: 'Quote requests',
  service_request: 'Service requests',
  job_application: 'Job applications'
};

interface Settings {
  notificationRecipientEmail: string;
  emailNotificationsConfigured: boolean;
  notificationCategories: Record<string, boolean>;
}

export function AdminSettings() {
  const navigate = useNavigate();
  const onUnauthorized = () => navigate('/admin/login', { replace: true });

  return (
    <div>
      <Seo title="Settings | Kamosa Admin" description="Kamosa admin settings." noindex />
      <h1 className="font-display text-xl font-bold text-ink-900">Settings</h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">Company details, notifications, and security.</p>

      <CompanyInfoCard onUnauthorized={onUnauthorized} />
      <NotificationsCard onUnauthorized={onUnauthorized} />
      <MfaCard onUnauthorized={onUnauthorized} />
    </div>
  );
}

function CompanyInfoCard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [values, setValues] = useState<{
    phone: string;
    whatsappNumber: string;
    email: string;
    tagline: string;
    homepageSeoTitle: string;
    homepageSeoDescription: string;
  } | null>(null);
  const [saved, setSaved] = useState<typeof values>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSavingState] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/admin/tools?resource=company-info', { credentials: 'include' });
    if (response.status === 401) return onUnauthorized();
    if (!response.ok) {
      setError('Could not load company information.');
      return;
    }
    const data = await response.json();
    setValues(data);
    setSaved(data);
  }, [onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof NonNullable<typeof values>, value: string) => {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const dirty = values && saved && JSON.stringify(values) !== JSON.stringify(saved);

  const save = async () => {
    if (!values) return;
    setError(null);
    setSavingState(true);
    const response = await fetch('/api/admin/tools?resource=company-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values)
    });
    setSavingState(false);
    if (response.status === 401) return onUnauthorized();
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? 'Could not save. Please try again.');
      return;
    }
    const data = await response.json();
    setValues(data);
    setSaved(data);
  };

  if (!values) {
    return (
      <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
        <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
        Loading…
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-2xl rounded-lg border border-hairline bg-white p-6 shadow-card">
      <h2 className="font-display text-[0.9375rem] font-bold text-ink-900">Company information</h2>
      <p className="mt-1 text-[0.8125rem] text-muted">
        These appear across the public site — the footer, contact page, WhatsApp buttons, and the "Call us" links.
        Changing a value here updates everywhere it's shown, without needing a code change.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Phone number</label>
          <input type="tel" value={values.phone} onChange={(e) => set('phone', e.target.value)} placeholder="071 191 4744" className={inputClass} />
          <p className={helpClass}>Shown as the "Call us" number site-wide.</p>
        </div>
        <div>
          <label className={labelClass}>WhatsApp number</label>
          <input
            type="text"
            value={values.whatsappNumber}
            onChange={(e) => set('whatsappNumber', e.target.value)}
            placeholder="27711914744"
            className={inputClass} />
          <p className={helpClass}>Digits only, with country code — no spaces or symbols.</p>
        </div>
        <div>
          <label className={labelClass}>Public contact email</label>
          <input type="email" value={values.email} onChange={(e) => set('email', e.target.value)} placeholder="info@kamosa.co.za" className={inputClass} />
          <p className={helpClass}>Shown publicly. This is separate from the private notification recipient below.</p>
        </div>
        <div>
          <label className={labelClass}>Tagline</label>
          <input type="text" value={values.tagline} onChange={(e) => set('tagline', e.target.value)} className={inputClass} />
          <p className={helpClass}>Shown under the logo in the footer.</p>
        </div>
      </div>

      <h3 className="mt-6 border-t border-hairline pt-5 font-display text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-ink-900">
        Homepage SEO
      </h3>
      <div className="mt-4 grid gap-4">
        <div>
          <label className={labelClass}>Homepage title</label>
          <input
            type="text"
            value={values.homepageSeoTitle}
            onChange={(e) => set('homepageSeoTitle', e.target.value)}
            placeholder="Kamosa (Pty) Ltd | Health, Safety, Compliance & Business Solutions"
            maxLength={70}
            className={inputClass} />
          <p className={helpClass}>{values.homepageSeoTitle.length}/70 characters. Leave blank to use the default.</p>
        </div>
        <div>
          <label className={labelClass}>Homepage description</label>
          <textarea
            rows={2}
            value={values.homepageSeoDescription}
            onChange={(e) => set('homepageSeoDescription', e.target.value)}
            placeholder="Kamosa (Pty) Ltd provides professional health, safety and compliance, business consulting, procurement and training solutions across South Africa."
            maxLength={160}
            className={inputClass} />
          <p className={helpClass}>{values.homepageSeoDescription.length}/160 characters. Shown in Google search results. Leave blank to use the default.</p>
        </div>
      </div>

      {error ? <p className="mt-4 text-[0.8125rem] text-error-600">{error}</p> : null}

      <div className="mt-5">
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

function NotificationsCard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const response = await fetch('/api/admin/tools?resource=settings', { credentials: 'include' });
    if (response.status === 401) return onUnauthorized();
    if (!response.ok) {
      setError('Could not load settings.');
      return;
    }
    const data = await response.json();
    setSettings(data);
    setEmail(data.notificationRecipientEmail);
    setCategories(data.notificationCategories);
  }, [onUnauthorized]);

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
      body: JSON.stringify({ notificationRecipientEmail: email, notificationCategories: categories })
    });
    setSaving(false);
    if (response.status === 401) return onUnauthorized();
    if (response.ok) {
      setSaved(true);
      load();
    } else {
      setError('Could not save. Please check the email address and try again.');
    }
  };

  const sendTest = async () => {
    setTestResult(null);
    setTesting(true);
    const response = await fetch('/api/admin/tools?resource=settings&action=test', { method: 'POST', credentials: 'include' });
    setTesting(false);
    if (response.status === 401) return onUnauthorized();
    const data = await response.json().catch(() => null);
    if (response.ok) {
      setTestResult({ ok: true, message: `Test email sent to ${data?.sentTo ?? email}.` });
    } else {
      setTestResult({ ok: false, message: data?.error ?? 'The test email could not be sent.' });
    }
  };

  if (!settings) {
    return (
      <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
        <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
        Loading…
      </div>
    );
  }

  const dirty = email !== settings.notificationRecipientEmail || JSON.stringify(categories) !== JSON.stringify(settings.notificationCategories);

  return (
    <div className="mt-6 max-w-2xl rounded-lg border border-hairline bg-white p-6 shadow-card">
      <h2 className="font-display text-[0.9375rem] font-bold text-ink-900">Notifications</h2>
      <div className="mt-3 flex items-center gap-2.5 text-[0.8125rem]">
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

      <div className="mt-5">
        <label className={labelClass}>Notification recipient email</label>
        <p className={helpClass}>
          Every enabled category below is sent here. This is separate from the public contact email shown on the website.
        </p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@kamosa.co.za" className={inputClass} />
      </div>

      <div className="mt-5">
        <label className={labelClass}>Notify me about</label>
        <div className="mt-2 space-y-2">
          {Object.entries(NOTIFICATION_CATEGORY_LABELS).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2.5 text-[0.875rem] text-ink-900">
              <input
                type="checkbox"
                checked={categories[key] ?? true}
                onChange={(e) => setCategories((prev) => ({ ...prev, [key]: e.target.checked }))} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {error ? <p className="mt-3 text-[0.8125rem] text-error-600">{error}</p> : null}
      {saved && !error ? <p className="mt-3 text-[0.8125rem] text-success-600">Saved.</p> : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="rounded-md bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={sendTest}
          disabled={testing || !settings.emailNotificationsConfigured}
          className="flex items-center gap-1.5 rounded-md border border-hairline px-4 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50">
          <SendIcon className="h-3.5 w-3.5" aria-hidden={true} />
          {testing ? 'Sending…' : 'Send test email'}
        </button>
      </div>
      {testResult ? (
        <p className={`mt-3 text-[0.8125rem] ${testResult.ok ? 'text-success-600' : 'text-error-600'}`}>{testResult.message}</p>
      ) : null}
    </div>
  );
}

function MfaCard({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await fetch('/api/admin/tools?resource=mfa', { credentials: 'include' });
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (response.ok) {
      const data = await response.json();
      setEnabled(data.enabled);
    }
  }, [onUnauthorized]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const startSetup = async () => {
    setError(null);
    setBusy(true);
    const response = await fetch('/api/admin/tools?resource=mfa&action=setup', { method: 'POST', credentials: 'include' });
    setBusy(false);
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (!response.ok) {
      setError('Could not start MFA setup. Please try again.');
      return;
    }
    const data = await response.json();
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setCode('');
    setMode('setup');
  };

  const confirmSetup = async () => {
    setError(null);
    setBusy(true);
    const response = await fetch('/api/admin/tools?resource=mfa&action=confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    });
    setBusy(false);
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? 'Incorrect code. Please try again.');
      return;
    }
    setMode('idle');
    setEnabled(true);
    setQrDataUrl(null);
    setSecret(null);
    setCode('');
  };

  const confirmDisable = async () => {
    setError(null);
    setBusy(true);
    const response = await fetch('/api/admin/tools?resource=mfa&action=disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code })
    });
    setBusy(false);
    if (response.status === 401) {
      onUnauthorized();
      return;
    }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? 'Incorrect code. Please try again.');
      return;
    }
    setMode('idle');
    setEnabled(false);
    setCode('');
  };

  if (enabled === null) {
    return (
      <div className="mt-6 flex max-w-2xl items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
        <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
        Loading…
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-2xl rounded-lg border border-hairline bg-white p-6 shadow-card">
      <div className="flex items-center gap-2.5">
        {enabled ? (
          <ShieldCheckIcon className="h-5 w-5 text-success-600" aria-hidden={true} />
        ) : (
          <ShieldOffIcon className="h-5 w-5 text-muted" aria-hidden={true} />
        )}
        <h2 className="font-display text-[0.9375rem] font-bold text-ink-900">Two-factor authentication</h2>
      </div>
      <p className="mt-2 text-[0.8125rem] text-muted">
        {enabled
          ? 'Enabled. Signing in requires the admin key plus a code from your authenticator app.'
          : 'Not enabled. Add a second step to admin sign-in using an authenticator app (Google Authenticator, Authy, 1Password, etc.).'}
      </p>
      <p className="mt-2 text-[0.75rem] text-muted">
        Note: this site uses one shared admin key rather than individual accounts, so this protects that one shared
        login — it doesn't yet support separate logins per person.
      </p>

      {mode === 'idle' && !enabled ? (
        <button
          type="button"
          onClick={startSetup}
          disabled={busy}
          className="mt-4 rounded-md bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? 'Starting…' : 'Set up two-factor authentication'}
        </button>
      ) : null}

      {mode === 'idle' && enabled ? (
        <button
          type="button"
          onClick={() => {
            setMode('disable');
            setCode('');
            setError(null);
          }}
          className="mt-4 rounded-md border border-hairline px-4 py-2 text-[0.8125rem] font-medium text-error-600 transition-colors duration-200 hover:bg-error-50">
          Turn off two-factor authentication
        </button>
      ) : null}

      {mode === 'setup' ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="text-[0.8125rem] text-ink-900">
            1. Scan this QR code with your authenticator app (or enter the key manually).
          </p>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="MFA setup QR code" className="mt-3 h-40 w-40 rounded-md border border-hairline" />
          ) : null}
          {secret ? (
            <p className="mt-2 break-all rounded-sm bg-cream px-2.5 py-1.5 font-mono text-[0.75rem] text-muted">{secret}</p>
          ) : null}

          <p className="mt-4 text-[0.8125rem] text-ink-900">2. Enter the 6-digit code it shows to confirm.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="mt-2 w-40 rounded-md border border-hairline bg-white px-3 py-2 text-center text-[1.0625rem] tracking-[0.3em] text-ink-900 focus:border-brand-600 focus:outline-none" />

          {error ? <p className="mt-2 text-[0.8125rem] text-error-600">{error}</p> : null}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={confirmSetup}
              disabled={busy || code.length !== 6}
              className="rounded-md bg-ink-900 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Confirming…' : 'Confirm and enable'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('idle');
                setError(null);
              }}
              className="rounded-md border border-hairline px-4 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'disable' ? (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="text-[0.8125rem] text-ink-900">Enter your current authenticator code to confirm turning MFA off.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            className="mt-2 w-40 rounded-md border border-hairline bg-white px-3 py-2 text-center text-[1.0625rem] tracking-[0.3em] text-ink-900 focus:border-brand-600 focus:outline-none" />

          {error ? <p className="mt-2 text-[0.8125rem] text-error-600">{error}</p> : null}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={confirmDisable}
              disabled={busy || code.length !== 6}
              className="rounded-md bg-error-600 px-4 py-2 text-[0.8125rem] font-semibold text-white transition-colors duration-200 hover:bg-error-600/90 disabled:cursor-not-allowed disabled:opacity-50">
              {busy ? 'Confirming…' : 'Turn off'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('idle');
                setError(null);
              }}
              className="rounded-md border border-hairline px-4 py-2 text-[0.8125rem] font-medium text-ink-900 transition-colors duration-200 hover:bg-cream">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
