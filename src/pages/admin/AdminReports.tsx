import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3Icon, BriefcaseIcon, ClockIcon, InboxIcon, Loader2Icon } from 'lucide-react';
import { Seo } from '../../components/Seo';

interface ReportsData {
  enquiries: { total: number; last30Days: number; byStatus: Record<string, number>; byType: Record<string, number> };
  applications: { total: number; byStatus: Record<string, number> };
  postings: { total: number; byStatus: Record<string, number> };
}

export function AdminReports() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/admin/tools?resource=reports', { credentials: 'include' });
      if (response.status === 401) {
        navigate('/admin/login', { replace: true });
        return;
      }
      if (!response.ok) {
        setError('Could not load reports.');
        return;
      }
      setData(await response.json());
    })();
  }, [navigate]);

  return (
    <div>
      <Seo title="Reports | Kamosa Admin" description="Kamosa admin reports." noindex />
      <h1 className="font-display text-xl font-bold text-ink-900">Reports</h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">A snapshot of enquiries, applications, and job postings.</p>

      {data === null && !error ? (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-muted shadow-card">
          <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
          Loading…
        </div>
      ) : null}

      {error ? <div className="mt-6 rounded-lg border border-hairline bg-white p-8 text-[0.9375rem] text-error-600 shadow-card">{error}</div> : null}

      {data ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={InboxIcon} label="Total enquiries" value={data.enquiries.total} />
            <StatCard icon={ClockIcon} label="Enquiries, last 30 days" value={data.enquiries.last30Days} />
            <StatCard icon={BriefcaseIcon} label="Total applications" value={data.applications.total} />
            <StatCard icon={BarChart3Icon} label="Open postings" value={data.postings.byStatus.open ?? 0} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <BreakdownCard title="Enquiries by status" counts={data.enquiries.byStatus} />
            <BreakdownCard title="Enquiries by type" counts={data.enquiries.byType} />
            <BreakdownCard title="Applications by status" counts={data.applications.byStatus} />
            <BreakdownCard title="Job postings by status" counts={data.postings.byStatus} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof InboxIcon; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-hairline bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
        <Icon className="h-4 w-4 text-ink-900" aria-hidden={true} />
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

function BreakdownCard({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, count]) => count));

  return (
    <div className="rounded-lg border border-hairline bg-white p-5 shadow-card">
      <h2 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-[0.8125rem] text-muted">No data yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {entries.map(([label, count]) => (
            <li key={label}>
              <div className="flex items-center justify-between text-[0.8125rem]">
                <span className="text-ink-900">{label}</span>
                <span className="font-semibold text-ink-900">{count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream">
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${(count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
