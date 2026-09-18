import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, BriefcaseBusinessIcon, Building2Icon, FileTextIcon, LogOutIcon, ShieldCheckIcon, UsersIcon } from 'lucide-react';
import { Container } from '../components/Container';

const stats = [
  { label: 'Active Projects', value: '24', change: '+12%', icon: BriefcaseBusinessIcon },
  { label: 'Compliance Checks', value: '89%', change: '+8%', icon: ShieldCheckIcon },
  { label: 'Clients', value: '186', change: '+15%', icon: UsersIcon },
  { label: 'Reports Issued', value: '42', change: '+19%', icon: FileTextIcon },
];

const recentTasks = [
  { title: 'Site induction review', owner: 'N. Mokoena', due: 'Today', status: 'In progress' },
  { title: 'ISO documentation audit', owner: 'L. Phiri', due: 'Tomorrow', status: 'Scheduled' },
  { title: 'Training attendance register', owner: 'K. Sibiya', due: 'Thu', status: 'Pending' },
  { title: 'Incident investigation follow-up', owner: 'A. Dlamini', due: 'Fri', status: 'Review' },
];

const operations = [
  'HSE toolbox talks for the week',
  'Procurement compliance checklist',
  'Leadership training roster update',
  'Environmental monitoring report submission',
];

export function AdminDashboard() {
  return (
    <Container as="main" className="py-28 lg:py-32">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-eyebrow font-semibold uppercase tracking-[0.18em] text-brand-600">
            Admin dashboard
          </p>
          <h1 className="mt-3 font-display text-display-md text-ink-900">Operations overview</h1>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-sm bg-brand-600 px-5 py-3 font-display text-sm font-semibold text-white transition-colors duration-200 hover:bg-ink-900"
          >
            New enquiry
            <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            to="/admin/logout"
            className="inline-flex items-center gap-2 rounded-sm border border-hairline bg-white px-4 py-3 font-display text-sm font-semibold text-ink-900 transition-colors duration-200 hover:border-brand-600 hover:text-brand-600"
          >
            <LogOutIcon className="h-4 w-4" aria-hidden="true" />
            Logout
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, icon: Icon }) => (
          <div key={label} className="rounded-sm border border-hairline bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream text-brand-600">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-6 flex items-end justify-between gap-3">
              <p className="font-display text-3xl font-bold tracking-tight text-ink-900">{value}</p>
              <span className="rounded-full bg-lime/15 px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-900">
                {change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-sm border border-hairline bg-white p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-ink-900">Recent tasks</h2>
            <span className="font-sans text-[0.75rem] uppercase tracking-[0.15em] text-muted">This week</span>
          </div>

          <div className="space-y-4">
            {recentTasks.map((task) => (
              <div key={task.title} className="flex flex-col gap-3 border-b border-hairline pb-4 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-base font-semibold text-ink-900">{task.title}</p>
                  <p className="mt-1 text-sm text-muted">Owner: {task.owner}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">{task.due}</span>
                  <span className="rounded-full bg-cream px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-900">
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-sm border border-hairline bg-ink-900 p-6 text-white shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600/20 text-lime">
              <Building2Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-lime">Priority</p>
              <h2 className="mt-1 font-display text-xl font-bold">Site readiness</h2>
            </div>
          </div>

          <ul className="mt-6 space-y-3 text-sm text-white/75">
            {operations.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-lime" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Container>
  );
}
