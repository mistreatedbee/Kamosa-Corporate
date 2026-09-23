import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { Seo } from '../../components/Seo';

interface Enquiry {
  id: string;
  type: string;
  status: string;
  name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  message: string | null;
  service_slug: string | null;
  source: string | null;
  created_at: string;
}

const TYPE_OPTIONS = [
{ value: '', label: 'All types' },
{ value: 'general', label: 'General' },
{ value: 'quote_hs', label: 'Quote — Health & Safety' },
{ value: 'quote_training', label: 'Quote — Training' },
{ value: 'quote_procurement', label: 'Quote — Procurement' },
{ value: 'service_request', label: 'Service Request' }];


const STATUS_OPTIONS = [
{ value: '', label: 'All statuses' },
{ value: 'New', label: 'New' },
{ value: 'Contacted', label: 'Contacted' },
{ value: 'Qualified', label: 'Qualified' },
{ value: 'In Progress', label: 'In Progress' },
{ value: 'Converted', label: 'Converted' },
{ value: 'Closed', label: 'Closed' },
{ value: 'Spam', label: 'Spam' }];


const STATUS_BADGE: Record<string, string> = {
  New: 'bg-info-50 text-info-600',
  Contacted: 'bg-info-50 text-info-600',
  Qualified: 'bg-warning-50 text-warning-600',
  'In Progress': 'bg-warning-50 text-warning-600',
  Converted: 'bg-success-50 text-success-600',
  Closed: 'bg-cream text-muted',
  Spam: 'bg-error-50 text-error-600'
};

export function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setError(null);
    const params = new URLSearchParams();
    if (typeFilter) params.set('type', typeFilter);
    if (statusFilter) params.set('status', statusFilter);

    const response = await fetch(`/api/admin/enquiries?${params.toString()}`, { credentials: 'include' });
    if (response.status === 401) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (!response.ok) {
      setError('Could not load enquiries.');
      return;
    }
    const data = await response.json();
    setEnquiries(data.enquiries);
  }, [typeFilter, statusFilter, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <Seo title="Enquiries | Kamosa Admin" description="Kamosa admin enquiry inbox." noindex />
      <h1 className="font-display text-xl font-bold text-ink-900">Enquiries</h1>
      <p className="mt-1.5 text-[0.9375rem] text-muted">
        All submissions from the contact form, quote requests, and service requests. Newest first.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-sm border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-sm border border-hairline bg-white px-3 py-2 text-[0.875rem] text-ink-900">
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 overflow-x-auto border border-hairline bg-white">
        {enquiries === null && !error ? (
          <div className="flex items-center gap-2 p-8 text-[0.9375rem] text-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden={true} />
            Loading…
          </div>
        ) : null}

        {error ? <div className="p-8 text-[0.9375rem] text-error-600">{error}</div> : null}

        {enquiries && enquiries.length === 0 ? (
          <div className="p-8 text-[0.9375rem] text-muted">No enquiries match this filter.</div>
        ) : null}

        {enquiries && enquiries.length > 0 ? (
          <table className="w-full min-w-[900px] text-left text-[0.875rem]">
            <thead>
              <tr className="border-b border-hairline bg-cream text-[0.75rem] font-bold uppercase tracking-[0.1em] text-muted">
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr key={enquiry.id} className="border-b border-hairline last:border-b-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(enquiry.created_at).toLocaleString('en-ZA', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink-900">{enquiry.name}</td>
                  <td className="px-4 py-3 text-muted">{enquiry.company_name || '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    <div>{enquiry.email}</div>
                    {enquiry.phone ? <div>{enquiry.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{enquiry.type}</td>
                  <td className="px-4 py-3 text-muted">{enquiry.service_slug || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-sm px-2 py-1 text-[0.75rem] font-semibold ${STATUS_BADGE[enquiry.status] ?? 'bg-cream text-muted'}`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td className="max-w-xs px-4 py-3 text-muted">{enquiry.message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </div>
  );
}
