import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircleIcon, Loader2Icon, ShieldCheckIcon } from 'lucide-react';
import { Seo } from '../../components/Seo';

/**
 * Stopgap admin auth per docs/SECURITY_ARCHITECTURE.md Finding 1.1. The key entered here is sent
 * once to /api/admin/login, verified server-side, and never stored client-side itself — the server
 * responds with an HttpOnly session cookie the browser can't read, and this component holds no
 * state about it beyond "did the request succeed."
 *
 * Two steps when MFA is enabled: the key screen, then (only if the server says so) a 6-digit
 * authenticator code screen. The component never knows in advance whether MFA is on — it finds out
 * from the login response, same as everyone else.
 */
export function AdminLogin() {
  const [step, setStep] = useState<'key' | 'mfa'>('key');
  const [key, setKey] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const codeInputRef = useRef<HTMLInputElement>(null);

  const handleKeySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError('Incorrect key. Please try again.');
        setSubmitting(false);
        return;
      }
      if (data?.mfaRequired) {
        setSubmitting(false);
        setStep('mfa');
        requestAnimationFrame(() => codeInputRef.current?.focus());
        return;
      }
      navigate('/admin', { replace: true });
    } catch {
      setError('A network error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ totpCode: code })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error === 'Your session expired. Please sign in again.' ? data.error : 'Incorrect code. Please try again.');
        setSubmitting(false);
        if (data?.error?.startsWith('Your session expired')) {
          setStep('key');
          setKey('');
          setCode('');
        }
        return;
      }
      navigate('/admin', { replace: true });
    } catch {
      setError('A network error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-900 px-4">
      <Seo title="Admin Sign In | Kamosa (Pty) Ltd" description="Kamosa admin sign in." noindex />

      {step === 'key' ? (
        <form onSubmit={handleKeySubmit} className="w-full max-w-sm border border-white/10 bg-white p-8" noValidate>
          <p className="font-display text-eyebrow font-semibold uppercase tracking-[0.18em] text-brand-600">
            Kamosa Admin
          </p>
          <h1 className="mt-3 font-display text-xl font-bold text-ink-900">Sign in</h1>

          <label htmlFor="admin-key" className="mt-7 block font-display text-[0.8125rem] font-semibold text-ink-900">
            Admin key
          </label>
          <input
            id="admin-key"
            type="password"
            autoComplete="off"
            required
            value={key}
            onChange={(event) => setKey(event.target.value)}
            aria-invalid={Boolean(error)}
            className="mt-2 w-full rounded-sm border border-hairline bg-white px-4 py-3 font-sans text-[0.9375rem] text-ink-900 transition-colors duration-200 focus:border-brand-600" />

          {error ? (
            <p className="mt-3 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-error-600">
              <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden={true} />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-brand-600 px-6 py-3 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
            {submitting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
                Signing in
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCodeSubmit} className="w-full max-w-sm border border-white/10 bg-white p-8" noValidate>
          <p className="flex items-center gap-2 font-display text-eyebrow font-semibold uppercase tracking-[0.18em] text-brand-600">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden={true} />
            Two-factor verification
          </p>
          <h1 className="mt-3 font-display text-xl font-bold text-ink-900">Enter your code</h1>
          <p className="mt-2 text-[0.875rem] text-muted">Open your authenticator app and enter the current 6-digit code.</p>

          <label htmlFor="mfa-code" className="mt-7 block font-display text-[0.8125rem] font-semibold text-ink-900">
            Authentication code
          </label>
          <input
            ref={codeInputRef}
            id="mfa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            aria-invalid={Boolean(error)}
            className="mt-2 w-full rounded-sm border border-hairline bg-white px-4 py-3 text-center font-sans text-[1.25rem] tracking-[0.4em] text-ink-900 transition-colors duration-200 focus:border-brand-600" />

          {error ? (
            <p className="mt-3 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-error-600">
              <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden={true} />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-brand-600 px-6 py-3 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
            {submitting ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
                Verifying
              </>
            ) : (
              'Verify'
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('key');
              setCode('');
              setError(null);
            }}
            className="mt-4 w-full text-center text-[0.8125rem] font-medium text-muted transition-colors duration-200 hover:text-ink-900">
            Back
          </button>
        </form>
      )}
    </div>
  );
}
