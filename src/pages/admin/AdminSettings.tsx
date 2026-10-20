import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2Icon, Loader2Icon, ShieldCheckIcon, ShieldOffIcon, XCircleIcon } from 'lucide-react';
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

      <MfaCard onUnauthorized={() => navigate('/admin/login', { replace: true })} />
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
      <div className="mt-6 flex max-w-lg items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
        <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
        Loading…
      </div>
    );
  }

  return (
    <div className="mt-6 max-w-lg rounded-lg border border-hairline bg-white p-6 shadow-card">
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
