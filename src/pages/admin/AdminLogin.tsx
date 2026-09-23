import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircleIcon, Loader2Icon } from 'lucide-react';
import { Seo } from '../../components/Seo';

/**
 * Stopgap admin auth per docs/SECURITY_ARCHITECTURE.md Finding 1.1. The key entered here is sent
 * once to /api/admin/login, verified server-side, and never stored client-side itself — the server
 * responds with an HttpOnly session cookie the browser can't read, and this component holds no
 * state about it beyond "did the request succeed."
 */
export function AdminLogin() {
  const [key, setKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      if (!response.ok) {
        setError('Incorrect key. Please try again.');
        setSubmitting(false);
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
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-white/10 bg-white p-8"
        noValidate>
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
    </div>
  );
}
