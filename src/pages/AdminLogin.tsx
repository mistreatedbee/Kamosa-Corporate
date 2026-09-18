import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Container } from '../components/Container';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'kamosa2026';
const ADMIN_STORAGE_KEY = 'kamosa-admin-auth';

export function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (typeof window !== 'undefined' && localStorage.getItem(ADMIN_STORAGE_KEY) === 'true') {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
      navigate('/admin');
      return;
    }

    setError('Invalid username or password.');
  };

  return (
    <Container as="main" className="flex min-h-screen items-center justify-center py-28">
      <div className="w-full max-w-md rounded-sm border border-hairline bg-white p-8 shadow-card">
        <div className="mb-6 text-center">
          <p className="font-display text-eyebrow font-semibold uppercase tracking-[0.18em] text-brand-600">Admin access</p>
          <h1 className="mt-3 font-display text-display-md text-ink-900">Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="mb-2 block font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-sm border border-hairline bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-muted/60 focus:border-brand-600 focus:outline-none"
              placeholder="admin"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-sm border border-hairline bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-muted/60 focus:border-brand-600 focus:outline-none"
              placeholder="Enter password"
            />
          </div>

          {error ? (
            <p className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-sm bg-brand-600 px-5 py-3 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink-900"
          >
            Sign in
          </button>
        </form>
      </div>
    </Container>
  );
}
