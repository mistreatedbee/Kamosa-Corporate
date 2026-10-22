import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Public, read-only overrides for the small set of company/contact fields the admin can edit from
// Settings (phone, WhatsApp number, email, tagline) plus the homepage SEO title/description.
// site_settings has NO public SELECT policy (admin-only, same as every other table) — this reads
// via the service role but returns ONLY this curated allow-list of keys, never the full table
// (which also holds the private notification recipient email and category toggles). Anything not
// explicitly listed here is never exposed, regardless of what gets added to site_settings later.
//
// Every value is optional in the response — the frontend's CompanyContext treats the hardcoded
// defaults in src/data/company.ts as the source of truth and only overrides a field if this
// returns a non-empty value for it, so a missing/failed fetch never breaks the live site.

const ALLOWED_KEYS = [
  'company_phone',
  'company_whatsapp_number',
  'company_email',
  'company_tagline',
  'homepage_seo_title',
  'homepage_seo_description'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // Misconfiguration, not a visitor error — respond with an empty override set so the caller's
    // hardcoded defaults are used, rather than failing the whole page.
    return res.status(200).json({});
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from('site_settings').select('key, value').in('key', ALLOWED_KEYS);

  if (error) {
    return res.status(200).json({});
  }

  const byKey = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));

  return res.status(200).json({
    phone: byKey.company_phone,
    whatsappNumber: byKey.company_whatsapp_number,
    email: byKey.company_email,
    tagline: byKey.company_tagline,
    homepageSeoTitle: byKey.homepage_seo_title,
    homepageSeoDescription: byKey.homepage_seo_description
  });
}
