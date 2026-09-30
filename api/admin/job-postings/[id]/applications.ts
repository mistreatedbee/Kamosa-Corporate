import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../../../_lib/adminSession.js';

// Applications for one job posting, each with a short-lived signed URL for the CV download.
// The cv-uploads bucket is private with no public/anon read policy (see
// supabase/migrations/0002_careers.sql) — this is the only place a CV becomes downloadable, and
// only for an authenticated admin, only for a few minutes.

const SIGNED_URL_TTL_SECONDS = 300;

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const jobPostingId = typeof req.query.id === 'string' ? req.query.id : undefined;
  if (!jobPostingId) {
    return res.status(400).json({ error: 'Missing job posting id' });
  }

  let supabase;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const { data, error } = await supabase
    .from('job_applications')
    .select('id, status, name, email, phone, cover_message, cv_storage_path, cv_file_name, created_at')
    .eq('job_posting_id', jobPostingId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to load applications' });
  }

  const applications = await Promise.all(
    (data ?? []).map(async (application) => {
      const { data: signed } = await supabase.storage
        .from('cv-uploads')
        .createSignedUrl(application.cv_storage_path, SIGNED_URL_TTL_SECONDS);
      return {
        id: application.id,
        status: application.status,
        name: application.name,
        email: application.email,
        phone: application.phone,
        cover_message: application.cover_message,
        cv_file_name: application.cv_file_name,
        created_at: application.created_at,
        cv_url: signed?.signedUrl ?? null
      };
    })
  );

  return res.status(200).json({ applications });
}
