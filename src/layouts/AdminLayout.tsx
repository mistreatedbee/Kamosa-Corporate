import { Outlet, useNavigate } from 'react-router-dom';
import { LogOutIcon } from 'lucide-react';

/**
 * Structurally separate from PublicLayout per docs/FRONTEND_ARCHITECTURE.md's explicit decision —
 * no public Navbar/Footer/WhatsApp button, denser/less marketing-styled shell. Auth itself is
 * enforced server-side per request by each /api/admin/* endpoint (see api/_lib/adminSession.ts) —
 * this layout has no client-side gate of its own; a page rendering with no data just means the
 * session check on its API call failed and the page should redirect (handled per-page).
 */
export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between border-b border-hairline bg-ink-900 px-6 py-4">
        <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
          Kamosa Admin
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 text-[0.8125rem] font-medium text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
          <LogOutIcon className="h-4 w-4" aria-hidden={true} />
          Log out
        </button>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
