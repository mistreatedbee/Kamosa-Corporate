import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3Icon, FileTextIcon, InboxIcon, LogOutIcon, MailIcon, SettingsIcon, UsersIcon } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Enquiries', to: '/admin', icon: InboxIcon, enabled: true },
  { label: 'Reports', to: '', icon: BarChart3Icon, enabled: false },
  { label: 'Clients', to: '', icon: UsersIcon, enabled: false },
  { label: 'Documents', to: '', icon: FileTextIcon, enabled: false },
  { label: 'Email Templates', to: '', icon: MailIcon, enabled: false },
  { label: 'Settings', to: '', icon: SettingsIcon, enabled: false }
];

/**
 * Structurally separate from PublicLayout per docs/FRONTEND_ARCHITECTURE.md's explicit decision —
 * no public Navbar/Footer/WhatsApp button, denser/less marketing-styled shell. Auth itself is
 * enforced server-side per request by each /api/admin/* endpoint (see api/_lib/adminSession.ts) —
 * this layout has no client-side gate of its own; a page rendering with no data just means the
 * session check on its API call failed and the page should redirect (handled per-page).
 * Every nav item besides Enquiries is a placeholder (disabled, "Soon" badge) — there is no page
 * behind them yet, so they must not be real links.
 */
export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#F4F2F1]">
      <aside className="flex w-60 shrink-0 flex-col bg-ink-900">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <img src="/logo.jpg" alt="Kamosa logo" className="h-8 w-8 rounded-sm object-cover ring-1 ring-white/10" />
          <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-white">
            Kamosa Admin
          </span>
        </div>

        <nav className="mt-4 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) =>
            item.enabled ? (
              <NavLink
                key={item.label}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-200 ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`
                }>
                <item.icon className="h-4 w-4" aria-hidden={true} />
                {item.label}
              </NavLink>
            ) : (
              <div
                key={item.label}
                className="flex cursor-not-allowed items-center justify-between gap-2.5 rounded-md px-3 py-2 text-[0.8125rem] font-medium text-white/30">
                <span className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4" aria-hidden={true} />
                  {item.label}
                </span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide">
                  Soon
                </span>
              </div>
            )
          )}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[0.8125rem] font-medium text-white/70 transition-colors duration-200 hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <LogOutIcon className="h-4 w-4" aria-hidden={true} />
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-8 py-10">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
