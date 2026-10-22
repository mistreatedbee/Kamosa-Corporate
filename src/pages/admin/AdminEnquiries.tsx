import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlarmClockIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  EyeIcon,
  InboxIcon,
  Loader2Icon,
  MailIcon,
  PhoneIcon,
  RefreshCwIcon,
  SearchIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  XIcon
} from 'lucide-react';
import { Seo } from '../../components/Seo';
import { EnquiryDetailPanel } from '../../components/admin/EnquiryDetailPanel';
import { ActionMenu, FollowUpIndicator, StatusBadge, ToastRegion } from '../../components/admin/EnquiryParts';
import { useToasts } from '../../components/admin/useToasts';
import type { MenuItem } from '../../components/admin/EnquiryParts';
import { adminRequest } from '../../lib/adminApi';
import {
  ACTIVE_STATUSES,
  EMPTY_FILTERS,
  ENQUIRY_STATUSES,
  SERVICE_FILTER_OPTIONS,
  SORT_OPTIONS,
  TYPE_LABELS,
  addDaysToDate,
  applyFiltersToParams,
  buildEnquiriesCsv,
  filtersFromParams,
  filtersToApiParams,
  followUpState,
  formatDateOnly,
  formatDateTime,
  formatDateTimeLong,
  hasActiveFilters,
  messagePreview,
  serviceLabel,
  todayInSouthAfrica,
  typeLabel,
  typeShortLabel
} from '../../lib/enquiries';
import type { EnquiryFilters, EnquiryRecord, ExportNote, ExportQuoteDetail, SortOption } from '../../lib/enquiries';

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  other: number;
  last7Days: number | null;
  last30Days: number | null;
  followUpDue: number | null;
  today: string;
}

interface ListResponse {
  enquiries: EnquiryRecord[];
  total: number;
  page: number;
  pageSize: number;
  stats: Stats;
  followUpEnabled: boolean;
}

interface ExportResponse {
  enquiries: EnquiryRecord[];
  quoteDetails: ExportQuoteDetail[];
  notes?: ExportNote[];
  truncated: boolean;
  followUpEnabled: boolean;
}

const PAGE_SIZE = 25;

const controlClass =
  'h-9 w-full rounded-md border border-hairline bg-white px-3 text-[0.8125rem] text-ink-900 focus:border-ink-700 focus:outline-none focus:ring-2 focus:ring-ink-700/10';
const secondaryButton =
  'inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-hairline bg-white px-3 text-[0.8125rem] font-semibold text-ink-900 transition-colors duration-150 hover:bg-[#F4F2F1] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

function sameStatuses(a: string[], b: string[]) {
  return a.length === b.length && a.every((s) => b.includes(s));
}

export function AdminEnquiries() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const openId = searchParams.get('enquiry');

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const { toasts, notify, dismiss } = useToasts();

  const onUnauthorized = useCallback(() => navigate('/admin/login', { replace: true }), [navigate]);
  const closeExport = useCallback(() => setExportOpen(false), []);

  const apiQuery = useMemo(() => filtersToApiParams(filters).toString(), [filters]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const params = new URLSearchParams(apiQuery);
    params.set('page', String(filters.page));
    params.set('pageSize', String(PAGE_SIZE));
    fetch(`/api/admin/enquiries?${params.toString()}`, { credentials: 'include', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          onUnauthorized();
          return;
        }
        if (!response.ok) {
          setError('Could not load enquiries. Please try again.');
          return;
        }
        setData((await response.json()) as ListResponse);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== 'AbortError') setError('Could not reach the server. Check your connection and try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [apiQuery, filters.page, reloadToken, onUnauthorized]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  const updateFilters = useCallback(
    (patch: Partial<EnquiryFilters>) => {
      setSearchParams(
        (prev) => applyFiltersToParams({ ...filtersFromParams(prev), page: 1, ...patch }, prev),
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // If an update moved the last row off this page (e.g. its status no longer matches the filter),
  // step back to the last page that has results instead of showing a misleading empty state.
  useEffect(() => {
    if (data && data.enquiries.length === 0 && data.total > 0 && data.page > 1) {
      updateFilters({ page: Math.ceil(data.total / data.pageSize) });
    }
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search → URL.
  useEffect(() => {
    if (searchDraft.trim() === filters.q.trim()) return;
    const timer = window.setTimeout(() => updateFilters({ q: searchDraft }), 300);
    return () => window.clearTimeout(timer);
  }, [searchDraft, filters.q, updateFilters]);

  // Keep the box in sync if the URL changes from elsewhere (back button, "Clear filters").
  const lastUrlQ = useRef(filters.q);
  useEffect(() => {
    if (lastUrlQ.current !== filters.q) {
      lastUrlQ.current = filters.q;
      setSearchDraft(filters.q);
    }
  }, [filters.q]);

  const clearFilters = () => {
    setSearchDraft('');
    setSearchParams((prev) => applyFiltersToParams({ ...EMPTY_FILTERS, sort: filtersFromParams(prev).sort }, prev), { replace: true });
  };

  const openEnquiry = (id: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('enquiry', id);
      return next;
    });
  };

  const closeEnquiry = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('enquiry');
      return next;
    });
  }, [setSearchParams]);

  const onRowSaved = useCallback(
    (enquiry: EnquiryRecord) => {
      setData((prev) => (prev ? { ...prev, enquiries: prev.enquiries.map((e) => (e.id === enquiry.id ? { ...e, ...enquiry } : e)) } : prev));
      reload(); // refresh KPI counts + filter membership from the database
    },
    [reload]
  );

  const changeStatus = async (enquiry: EnquiryRecord, status: string) => {
    if (savingIds.has(enquiry.id) || status === enquiry.status) return;
    setSavingIds((prev) => new Set(prev).add(enquiry.id));
    const result = await adminRequest<{ enquiry: EnquiryRecord }>(`/api/admin/enquiries?id=${encodeURIComponent(enquiry.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(enquiry.id);
      return next;
    });
    if (result.status === 401) return onUnauthorized();
    if (!result.ok || !result.data) {
      notify('error', result.error ?? `Could not change the status of ${enquiry.name}'s enquiry. Nothing was changed.`);
      return;
    }
    onRowSaved(result.data.enquiry);
    notify('success', `${enquiry.name}: status changed to ${result.data.enquiry.status}.`);
  };

  const copyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      notify('success', 'Email address copied.');
    } catch {
      notify('error', 'Could not copy — your browser blocked clipboard access.');
    }
  };

  const stats = data?.stats;
  const today = stats?.today ?? todayInSouthAfrica();
  const activeCount = stats ? ACTIVE_STATUSES.reduce((sum, s) => sum + (stats.byStatus[s] ?? 0), 0) : null;
  const filtered = hasActiveFilters(filters);
  const activeFilterCount =
    (filters.statuses.length > 0 ? 1 : 0) + [filters.type, filters.service, filters.from || filters.to, filters.followUp].filter(Boolean).length;

  const rowMenuItems = (enquiry: EnquiryRecord): MenuItem[] => [
    { label: 'View details', icon: EyeIcon, onSelect: () => openEnquiry(enquiry.id) },
    { label: 'Email client', icon: MailIcon, href: `mailto:${enquiry.email}?subject=${encodeURIComponent('Your enquiry to Kamosa')}` },
    ...(enquiry.phone ? [{ label: 'Call client', icon: PhoneIcon, href: `tel:${enquiry.phone.replace(/[^0-9+]/g, '')}` }] : []),
    { label: 'Copy email address', icon: CopyIcon, onSelect: () => copyEmail(enquiry.email) },
    { label: 'Change status', heading: true },
    ...ENQUIRY_STATUSES.map((status) => ({
      label: status,
      current: status === enquiry.status,
      disabled: status === enquiry.status || savingIds.has(enquiry.id),
      onSelect: () => changeStatus(enquiry, status)
    }))
  ];

  const statusSelectValue =
    filters.statuses.length === 0
      ? ''
      : filters.statuses.length === 1
        ? filters.statuses[0]
        : sameStatuses(filters.statuses, ACTIVE_STATUSES)
          ? '__active'
          : '__custom';

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <Seo title="Enquiries | Kamosa Admin" description="Kamosa admin enquiry management." noindex />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Enquiries</h1>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">
            Manage contact enquiries, quote requests and service enquiries. Review submissions, follow up with clients and track their progress.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={reload} disabled={loading} className={secondaryButton} aria-label="Refresh enquiries">
            <RefreshCwIcon className={`h-4 w-4 ${loading && data ? 'animate-spin' : ''}`} aria-hidden={true} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button type="button" onClick={() => setExportOpen(true)} disabled={!stats || stats.total === 0} className={secondaryButton}>
            <DownloadIcon className="h-4 w-4" aria-hidden={true} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards — counts across ALL enquiries; clicking filters the list */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={InboxIcon}
          label="Total enquiries"
          value={stats?.total}
          hint="All time"
          active={!filtered}
          onClick={clearFilters}
        />
        <KpiCard
          icon={SparklesIcon}
          label="New"
          value={stats?.byStatus.New}
          hint="Not yet reviewed"
          accent="text-info-600"
          active={sameStatuses(filters.statuses, ['New'])}
          onClick={() => updateFilters({ statuses: ['New'] })}
        />
        <KpiCard
          icon={ClockIcon}
          label="In progress"
          value={activeCount ?? undefined}
          hint="Contacted, qualified or in progress"
          accent="text-warning-600"
          active={sameStatuses(filters.statuses, ACTIVE_STATUSES)}
          onClick={() => updateFilters({ statuses: ACTIVE_STATUSES })}
        />
        <KpiCard
          icon={CheckCircle2Icon}
          label="Converted"
          value={stats?.byStatus.Converted}
          hint="Resulted in business"
          accent="text-success-600"
          active={sameStatuses(filters.statuses, ['Converted'])}
          onClick={() => updateFilters({ statuses: ['Converted'] })}
        />
      </div>

      {/* Secondary metrics + full status breakdown, so no status is hidden from view */}
      {stats ? (
        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-hairline bg-white px-4 py-3 text-[0.8125rem] lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {stats.last7Days !== null ? (
              <MetricLink
                icon={CalendarDaysIcon}
                label="Received in last 7 days"
                value={stats.last7Days}
                onClick={() => updateFilters({ from: addDaysToDate(today, -6), to: '' })}
              />
            ) : null}
            {stats.last30Days !== null ? (
              <MetricLink label="Last 30 days" value={stats.last30Days} onClick={() => updateFilters({ from: addDaysToDate(today, -29), to: '' })} />
            ) : null}
            {stats.followUpDue !== null ? (
              <MetricLink
                icon={AlarmClockIcon}
                label="Follow-ups due"
                value={stats.followUpDue}
                emphasis={stats.followUpDue > 0}
                onClick={() => updateFilters({ followUp: 'due' })}
              />
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-muted" aria-label="Enquiries by status">
            {ENQUIRY_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateFilters({ statuses: [status] })}
                className="rounded hover:text-ink-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
                {status} <span className="font-semibold text-ink-900">{stats.byStatus[status] ?? 0}</span>
              </button>
            ))}
            {stats.other > 0 ? <span>Other {stats.other}</span> : null}
          </div>
        </div>
      ) : null}

      {/* Toolbar */}
      <div className="mt-6 rounded-lg border border-hairline bg-white">
        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="enquiry-search" className="sr-only">
              Search enquiries
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden={true} />
            <input
              id="enquiry-search"
              type="search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search name, email, phone, company or message"
              className={`${controlClass} pl-9`}
            />
          </div>
          <div className="flex gap-2">
            <label htmlFor="enquiry-sort" className="sr-only">
              Sort
            </label>
            <select
              id="enquiry-sort"
              value={filters.sort}
              onChange={(event) => updateFilters({ sort: event.target.value as SortOption })}
              className={`${controlClass} sm:w-44`}>
              {SORT_OPTIONS.filter((option) => option.value !== 'follow_up' || data?.followUpEnabled !== false).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              aria-expanded={filtersOpen}
              aria-controls="enquiry-filters"
              className={`${secondaryButton} md:hidden`}>
              <SlidersHorizontalIcon className="h-4 w-4" aria-hidden={true} />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        </div>

        <div
          id="enquiry-filters"
          className={`${filtersOpen ? 'grid' : 'hidden'} grid-cols-1 gap-2 border-t border-hairline p-3 sm:grid-cols-2 md:grid md:grid-cols-5`}>
          <FilterField label="Status" htmlFor="filter-status">
            <select
              id="filter-status"
              value={statusSelectValue}
              onChange={(event) => {
                const value = event.target.value;
                updateFilters({ statuses: value === '' ? [] : value === '__active' ? ACTIVE_STATUSES : [value] });
              }}
              className={controlClass}>
              <option value="">All statuses{stats ? ` (${stats.total})` : ''}</option>
              <option value="__active">In progress — all active{activeCount !== null ? ` (${activeCount})` : ''}</option>
              {ENQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                  {stats ? ` (${stats.byStatus[status] ?? 0})` : ''}
                </option>
              ))}
              {statusSelectValue === '__custom' ? <option value="__custom">{filters.statuses.join(', ')}</option> : null}
            </select>
          </FilterField>
          <FilterField label="Enquiry type" htmlFor="filter-type">
            <select id="filter-type" value={filters.type} onChange={(event) => updateFilters({ type: event.target.value })} className={controlClass}>
              <option value="">All types</option>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Service" htmlFor="filter-service">
            <select id="filter-service" value={filters.service} onChange={(event) => updateFilters({ service: event.target.value })} className={controlClass}>
              <option value="">All services</option>
              {SERVICE_FILTER_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="Received from" htmlFor="filter-from">
            <input
              id="filter-from"
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(event) => updateFilters({ from: event.target.value })}
              className={controlClass}
            />
          </FilterField>
          <FilterField label="Received to" htmlFor="filter-to">
            <input
              id="filter-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) => updateFilters({ to: event.target.value })}
              className={controlClass}
            />
          </FilterField>
        </div>

        {filtered ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-3 py-2.5">
            <span className="text-[0.75rem] text-muted">Filters:</span>
            {filters.q.trim() ? <Chip label={`Search: “${filters.q.trim()}”`} onRemove={() => { setSearchDraft(''); updateFilters({ q: '' }); }} /> : null}
            {filters.statuses.length ? (
              <Chip
                label={`Status: ${sameStatuses(filters.statuses, ACTIVE_STATUSES) ? 'In progress (all active)' : filters.statuses.join(', ')}`}
                onRemove={() => updateFilters({ statuses: [] })}
              />
            ) : null}
            {filters.type ? <Chip label={`Type: ${typeLabel(filters.type)}`} onRemove={() => updateFilters({ type: '' })} /> : null}
            {filters.service ? (
              <Chip label={`Service: ${SERVICE_FILTER_OPTIONS.find((o) => o.key === filters.service)?.label}`} onRemove={() => updateFilters({ service: '' })} />
            ) : null}
            {filters.from || filters.to ? (
              <Chip
                label={`Received: ${filters.from ? formatDateOnly(filters.from) : 'any time'} – ${filters.to ? formatDateOnly(filters.to) : 'today'}`}
                onRemove={() => updateFilters({ from: '', to: '' })}
              />
            ) : null}
            {filters.followUp ? <Chip label="Follow-up due" onRemove={() => updateFilters({ followUp: '' })} /> : null}
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-[0.75rem] font-semibold text-ink-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {/* Results */}
      <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-white">
        {data ? (
          <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5 text-[0.75rem] text-muted">
            <span aria-live="polite">
              {data.total === 0
                ? 'No matching enquiries'
                : `Showing ${rangeStart}–${rangeEnd} of ${data.total} ${filtered ? 'matching ' : ''}${data.total === 1 ? 'enquiry' : 'enquiries'}`}
              {filtered && stats ? ` · ${stats.total} in total` : ''}
            </span>
            {loading ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-label="Updating" /> : null}
          </div>
        ) : null}

        {!data && loading ? <LoadingRows /> : null}

        {error ? (
          <div className="flex flex-col items-start gap-3 p-6 text-[0.875rem] text-error-600" role="alert">
            <p>{error}</p>
            <button type="button" onClick={reload} className={secondaryButton}>
              <RefreshCwIcon className="h-3.5 w-3.5" aria-hidden={true} />
              Try again
            </button>
          </div>
        ) : null}

        {data && !error && data.enquiries.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <InboxIcon className="h-8 w-8 text-cream" aria-hidden={true} />
            <p className="text-[0.9375rem] font-semibold text-ink-900">{filtered ? 'No enquiries match these filters' : 'No enquiries yet'}</p>
            <p className="max-w-sm text-[0.8125rem] text-muted">
              {filtered
                ? 'Try a different search term or widen the filters.'
                : 'Submissions from the contact form, quote requests and service requests will appear here as soon as someone gets in touch.'}
            </p>
            {filtered ? (
              <button type="button" onClick={clearFilters} className={secondaryButton}>
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}

        {data && !error && data.enquiries.length > 0 ? (
          <>
            {/* Wide screens: table */}
            <div className="relative hidden overflow-x-auto xl:block">
              <table className="w-full text-left text-[0.8125rem]">
                <thead>
                  <tr className="whitespace-nowrap border-b border-hairline bg-[#FAF9F8] text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
                    <th scope="col" className="px-4 py-2.5 font-semibold">Received</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Contact</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Company</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Enquiry type</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Service</th>
                    <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                    <th scope="col" className="hidden px-4 py-2.5 font-semibold min-[1400px]:table-cell">Message</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.enquiries.map((enquiry) => {
                    const fu = followUpState(enquiry.next_follow_up_at, enquiry.status, today);
                    const preview = messagePreview(enquiry.message, 90);
                    return (
                      <tr key={enquiry.id} className="border-b border-hairline align-top last:border-b-0 hover:bg-[#FAF9F8]">
                        <td className="whitespace-nowrap px-4 py-3 text-muted" title={formatDateTimeLong(enquiry.created_at)}>
                          <div className="text-ink-900">{formatDateTime(enquiry.created_at).split(',')[0]}</div>
                          <div className="text-[0.75rem]">{formatDateTime(enquiry.created_at).split(', ')[1]}</div>
                        </td>
                        <td className="max-w-[15rem] px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openEnquiry(enquiry.id)}
                            className="text-left font-semibold text-ink-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
                            {enquiry.name}
                          </button>
                          <a href={`mailto:${enquiry.email}`} className="block truncate text-[0.75rem] text-muted hover:text-info-600 hover:underline" title={enquiry.email}>
                            {enquiry.email}
                          </a>
                          {enquiry.phone ? (
                            <a href={`tel:${enquiry.phone.replace(/[^0-9+]/g, '')}`} className="block text-[0.75rem] text-muted hover:text-info-600 hover:underline">
                              {enquiry.phone}
                            </a>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {enquiry.company_name ? <span className="text-ink-900">{enquiry.company_name}</span> : <span className="italic text-muted">Not provided</span>}
                        </td>
                        <td className="px-4 py-3 text-ink-900" title={typeLabel(enquiry.type)}>
                          {typeShortLabel(enquiry.type)}
                        </td>
                        <td className="px-4 py-3 text-ink-900">{serviceLabel(enquiry.service_slug) ?? <span className="text-muted">—</span>}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1">
                            <StatusBadge status={enquiry.status} />
                            <FollowUpIndicator state={fu} date={enquiry.next_follow_up_at} />
                            {savingIds.has(enquiry.id) ? <span className="text-[0.6875rem] text-muted">Saving…</span> : null}
                          </div>
                        </td>
                        <td className="hidden max-w-[16rem] px-4 py-3 text-muted min-[1400px]:table-cell">
                          <p className="line-clamp-2" title={enquiry.message ?? undefined}>
                            {preview || <span className="italic">No message</span>}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEnquiry(enquiry.id)}
                              className="rounded-md px-2 py-1.5 text-[0.75rem] font-semibold text-ink-900 hover:bg-white hover:ring-1 hover:ring-hairline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
                              View
                            </button>
                            <ActionMenu label={`Actions for ${enquiry.name}`} items={rowMenuItems(enquiry)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Phones, tablets and small laptops: cards */}
            <ul className="divide-y divide-hairline xl:hidden">
              {data.enquiries.map((enquiry) => {
                const fu = followUpState(enquiry.next_follow_up_at, enquiry.status, today);
                const preview = messagePreview(enquiry.message, 110);
                return (
                  <li key={enquiry.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => openEnquiry(enquiry.id)}
                          className="text-left text-[0.9375rem] font-semibold text-ink-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
                          {enquiry.name}
                        </button>
                        <p className="truncate text-[0.8125rem] text-muted">{enquiry.company_name || 'Company not provided'}</p>
                      </div>
                      <StatusBadge status={enquiry.status} />
                    </div>
                    <p className="mt-2 text-[0.8125rem] text-ink-900">
                      {typeShortLabel(enquiry.type)}
                      {serviceLabel(enquiry.service_slug) ? <span className="text-muted"> · {serviceLabel(enquiry.service_slug)}</span> : null}
                    </p>
                    {preview ? <p className="mt-1 line-clamp-2 text-[0.8125rem] text-muted">{preview}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-muted">
                      <span title={formatDateTimeLong(enquiry.created_at)}>{formatDateTime(enquiry.created_at)}</span>
                      <FollowUpIndicator state={fu} date={enquiry.next_follow_up_at} />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button type="button" onClick={() => openEnquiry(enquiry.id)} className={`${secondaryButton} flex-1 sm:flex-none`}>
                        <EyeIcon className="h-4 w-4" aria-hidden={true} />
                        View
                      </button>
                      <a href={`mailto:${enquiry.email}`} className={secondaryButton} aria-label={`Email ${enquiry.name}`}>
                        <MailIcon className="h-4 w-4" aria-hidden={true} />
                      </a>
                      {enquiry.phone ? (
                        <a href={`tel:${enquiry.phone.replace(/[^0-9+]/g, '')}`} className={secondaryButton} aria-label={`Call ${enquiry.name}`}>
                          <PhoneIcon className="h-4 w-4" aria-hidden={true} />
                        </a>
                      ) : null}
                      <ActionMenu label={`Actions for ${enquiry.name}`} items={rowMenuItems(enquiry)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}

        {data && data.total > data.pageSize ? (
          <nav className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3" aria-label="Pagination">
            <span className="text-[0.75rem] text-muted">
              Page {data.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={data.page <= 1 || loading} onClick={() => updateFilters({ page: data.page - 1 })} className={secondaryButton}>
                <ChevronLeftIcon className="h-4 w-4" aria-hidden={true} />
                Previous
              </button>
              <button type="button" disabled={data.page >= totalPages || loading} onClick={() => updateFilters({ page: data.page + 1 })} className={secondaryButton}>
                Next
                <ChevronRightIcon className="h-4 w-4" aria-hidden={true} />
              </button>
            </div>
          </nav>
        ) : null}
      </div>

      {openId ? (
        <EnquiryDetailPanel enquiryId={openId} onClose={closeEnquiry} onUpdated={onRowSaved} onNotify={notify} onUnauthorized={onUnauthorized} />
      ) : null}

      {exportOpen && stats ? (
        <ExportDialog
          filters={filters}
          filteredCount={filtered ? data?.total ?? null : null}
          totalCount={stats.total}
          onClose={closeExport}
          onNotify={notify}
          onUnauthorized={onUnauthorized}
        />
      ) : null}

      <ToastRegion toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'text-ink-900',
  active,
  onClick
}: {
  icon: typeof InboxIcon;
  label: string;
  value: number | undefined;
  hint: string;
  accent?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group rounded-lg border bg-white p-4 text-left transition-colors duration-150 hover:border-ink-700/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
        active ? 'border-ink-900 ring-1 ring-ink-900' : 'border-hairline'
      }`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.75rem] font-semibold text-muted">{label}</span>
        <Icon className={`h-4 w-4 ${accent}`} aria-hidden={true} />
      </div>
      <p className="mt-2 font-display text-[1.75rem] font-bold leading-none text-ink-900">
        {value === undefined ? <span className="inline-block h-7 w-8 animate-pulse rounded bg-[#F1EFEE]" aria-label="Loading" /> : value}
      </p>
      <p className="mt-1.5 truncate text-[0.6875rem] text-muted">{hint}</p>
    </button>
  );
}

function MetricLink({
  icon: Icon,
  label,
  value,
  emphasis,
  onClick
}: {
  icon?: typeof InboxIcon;
  label: string;
  value: number;
  emphasis?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded text-muted hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
      {Icon ? <Icon className={`h-3.5 w-3.5 ${emphasis ? 'text-error-600' : ''}`} aria-hidden={true} /> : null}
      <span>{label}</span>
      <span className={`font-semibold ${emphasis ? 'text-error-600' : 'text-ink-900'}`}>{value}</span>
    </button>
  );
}

function FilterField({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-hairline bg-[#FAF9F8] py-0.5 pl-2.5 pr-1 text-[0.75rem] text-ink-900">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${label}`}
        className="rounded-full p-0.5 text-muted hover:bg-white hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600">
        <XIcon className="h-3 w-3" aria-hidden={true} />
      </button>
    </span>
  );
}

function LoadingRows() {
  return (
    <div className="divide-y divide-hairline" aria-label="Loading enquiries">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-4">
          <div className="h-3 w-20 animate-pulse rounded bg-[#F1EFEE]" />
          <div className="h-3 flex-1 animate-pulse rounded bg-[#F1EFEE]" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-[#F1EFEE]" />
        </div>
      ))}
    </div>
  );
}

function ExportDialog({
  filters,
  filteredCount,
  totalCount,
  onClose,
  onNotify,
  onUnauthorized
}: {
  filters: EnquiryFilters;
  filteredCount: number | null;
  totalCount: number;
  onClose: () => void;
  onNotify: (tone: 'success' | 'error', text: string) => void;
  onUnauthorized: () => void;
}) {
  const [scope, setScope] = useState<'filtered' | 'all'>(filteredCount !== null ? 'filtered' : 'all');
  const [includeInternal, setIncludeInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  const download = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const params = scope === 'filtered' ? filtersToApiParams(filters) : new URLSearchParams(filters.sort !== 'newest' ? { sort: filters.sort } : {});
    params.set('export', '1');
    if (includeInternal) params.set('includeNotes', '1');
    const result = await adminRequest<ExportResponse>(`/api/admin/enquiries?${params.toString()}`);
    setBusy(false);
    if (result.status === 401) return onUnauthorized();
    if (!result.ok || !result.data) {
      setError(result.error ?? 'The export failed. Please try again.');
      return;
    }
    const rows = result.data.enquiries;
    if (rows.length === 0) {
      setError('There are no enquiries to export for this selection.');
      return;
    }
    const csv = buildEnquiriesCsv(rows, {
      quoteDetails: result.data.quoteDetails,
      notes: result.data.notes,
      includeNotes: includeInternal,
      includeFollowUp: includeInternal && result.data.followUpEnabled
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kamosa-enquiries-${scope === 'all' ? 'all' : 'filtered'}-${todayInSouthAfrica()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    onNotify(
      'success',
      `Exported ${rows.length} ${rows.length === 1 ? 'enquiry' : 'enquiries'}${result.data.truncated ? ' (limit reached — narrow the filters for the rest)' : ''}.`
    );
    onClose();
  };

  const radio = 'flex cursor-pointer items-start gap-3 rounded-md border border-hairline p-3 has-[:checked]:border-ink-900 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-ink-900/40" aria-hidden={true} onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="export-title" className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-lift">
        <h2 id="export-title" className="font-display text-lg font-bold text-ink-900">
          Export enquiries to CSV
        </h2>
        <fieldset className="mt-4 space-y-2">
          <legend className="sr-only">Which enquiries</legend>
          <label className={radio}>
            <input type="radio" name="export-scope" checked={scope === 'filtered'} disabled={filteredCount === null} onChange={() => setScope('filtered')} className="mt-0.5 accent-ink-900" />
            <span>
              <span className="block text-[0.875rem] font-semibold text-ink-900">
                Matching current filters{filteredCount !== null ? ` (${filteredCount})` : ''}
              </span>
              <span className="block text-[0.75rem] text-muted">{filteredCount === null ? 'No filters are active.' : 'Every matching record, not just this page.'}</span>
            </span>
          </label>
          <label className={radio}>
            <input type="radio" name="export-scope" checked={scope === 'all'} onChange={() => setScope('all')} className="mt-0.5 accent-ink-900" />
            <span>
              <span className="block text-[0.875rem] font-semibold text-ink-900">All enquiries ({totalCount})</span>
              <span className="block text-[0.75rem] text-muted">Ignores the filters.</span>
            </span>
          </label>
        </fieldset>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={includeInternal} onChange={(event) => setIncludeInternal(event.target.checked)} className="mt-0.5 accent-ink-900" />
          <span>
            <span className="block text-[0.875rem] font-semibold text-ink-900">Include internal notes and follow-up dates</span>
            <span className="block text-[0.75rem] text-muted">Admin-only information. Leave unticked if this file will be shared outside the team.</span>
          </span>
        </label>
        {error ? (
          <p role="alert" className="mt-3 text-[0.8125rem] text-error-600">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryButton}>
            Cancel
          </button>
          <button
            type="button"
            onClick={download}
            disabled={busy}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-ink-900 px-3.5 text-[0.8125rem] font-semibold text-white hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
            {busy ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden={true} /> : <DownloadIcon className="h-3.5 w-3.5" aria-hidden={true} />}
            {busy ? 'Preparing…' : 'Download CSV'}
          </button>
        </div>
      </div>
    </div>
  );
}
