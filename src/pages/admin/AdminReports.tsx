import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3Icon, BriefcaseIcon, ClockIcon, InboxIcon, Loader2Icon } from 'lucide-react';
import { Seo } from '../../components/Seo';
import { InteractiveBarChart, type BarDatum } from '../../components/admin/InteractiveBarChart';

interface ReportsData {
  enquiries: { total: number; last30Days: number; byStatus: Record<string, number>; byType: Record<string, number> };
  applications: { total: number; byStatus: Record<string, number> };
  postings: { total: number; byStatus: Record<string, number> };
}

// Fixed pipeline order + color, matching the status badges already used on the Enquiries and
// Careers pages exactly — a chart using different colors for the same status would be its own
// small inconsistency bug. Zero-count statuses are still shown (not filtered out) so the chart
// reads as the whole pipeline, not just whatever happens to have data today.
const ENQUIRY_STATUS_COLORS: Record<string, string> = {
  New: 'bg-info-600',
  Contacted: 'bg-info-600',
  Qualified: 'bg-warning-600',
  'In Progress': 'bg-warning-600',
  Converted: 'bg-success-600',
  Closed: 'bg-muted',
  Spam: 'bg-error-600'
};

const APPLICATION_STATUS_COLORS: Record<string, string> = {
  New: 'bg-info-600',
  Reviewed: 'bg-info-600',
  Shortlisted: 'bg-warning-600',
  Interviewing: 'bg-warning-600',
  Offered: 'bg-success-600',
  Hired: 'bg-success-600',
  Rejected: 'bg-error-600'
};

const POSTING_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted',
  open: 'bg-success-600',
  closed: 'bg-error-600'
};

const TYPE_LABELS: Record<string, string> = {
  general: 'General',
  quote_hs: 'Quote — Health & Safety',
  quote_training: 'Quote — Training',
  quote_procurement: 'Quote — Procurement',
  service_request: 'Service Request'
};

function toBarData(order: string[], counts: Record<string, number>, colors: Record<string, string>, labels?: Record<string, string>): BarDatum[] {
  return order.map((key) => ({
    label: labels?.[key] ?? key,
    value: counts[key] ?? 0,
    color: colors[key] ?? 'bg-brand-600'
  }));
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
            <InteractiveBarChart
              title="Enquiries by status"
              data={toBarData(Object.keys(ENQUIRY_STATUS_COLORS), data.enquiries.byStatus, ENQUIRY_STATUS_COLORS)} />
            <InteractiveBarChart
              title="Enquiries by type"
              data={toBarData(Object.keys(TYPE_LABELS), data.enquiries.byType, {}, TYPE_LABELS)} />
            <InteractiveBarChart
              title="Applications by status"
              data={toBarData(Object.keys(APPLICATION_STATUS_COLORS), data.applications.byStatus, APPLICATION_STATUS_COLORS)} />
            <InteractiveBarChart
              title="Job postings by status"
              data={toBarData(Object.keys(POSTING_STATUS_COLORS), data.postings.byStatus, POSTING_STATUS_COLORS)} />
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
