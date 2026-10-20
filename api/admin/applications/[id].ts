import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../../_lib/adminSession.js';
import { notifyByEmail } from '../../_lib/notifyEmail.js';

// Status update for a single job application — mirrors api/admin/enquiries/[id].ts, plus an
// applicant-facing email on the three decision statuses (Offered/Rejected/Hired). Those are the
// only transitions worth emailing: the applicant already knows they applied, and every earlier
// stage (Reviewed/Shortlisted/Interviewing) is internal workflow, not something to notify on.

const VALID_STATUSES = ['New', 'Reviewed', 'Shortlisted', 'Interviewing', 'Offered', 'Rejected', 'Hired', 'Withdrawn'];
const NOTIFY_STATUSES = new Set(['Offered', 'Rejected', 'Hired']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : undefined;
  if (!id) {
    return res.status(400).json({ error: 'Missing application id' });
  }

  let body: { status?: string };
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Server is not configured' });
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from('job_applications')
    .update({ status: body.status })
    .eq('id', id)
    .select('id, status, name, email, job_posting_id, job_postings(title)')
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Application not found or update failed' });
  }

  if (NOTIFY_STATUSES.has(body.status)) {
    const jobTitle = (data as unknown as { job_postings: { title: string } | null }).job_postings?.title ?? 'the role';
    await notifyByEmail({
      type: 'application_status_update',
      to: data.email,
      subject: `Update on your application for ${jobTitle}`,
      vars: { name: data.name, role: jobTitle, status: body.status },
      lines: [
        { label: 'Role', value: jobTitle },
        { label: 'Status', value: body.status }
      ]
    });
  }

  return res.status(200).json({ id: data.id, status: data.status });
}
