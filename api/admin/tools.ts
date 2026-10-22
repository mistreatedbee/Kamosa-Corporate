import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';
import { rejectIfUnauthorized } from '../_lib/adminSession.js';

// Backs the five remaining admin sidebar/login concerns — Reports, Documents, Email Templates,
// Settings, and MFA enrollment — as one flat function, dispatched by a `resource` query param
// (plus method, and a resource-specific `path`/`type`/`action` param where needed):
//   GET    /api/admin/tools?resource=reports
//   GET    /api/admin/tools?resource=documents
//   POST   /api/admin/tools?resource=documents                  (upload, JSON body, see below)
//   DELETE /api/admin/tools?resource=documents&path=<path>
//   GET    /api/admin/tools?resource=email-templates
//   PATCH  /api/admin/tools?resource=email-templates&type=<type>
//   DELETE /api/admin/tools?resource=email-templates&type=<type> (reset to default)
//   GET    /api/admin/tools?resource=settings
//   PATCH  /api/admin/tools?resource=settings
//   GET    /api/admin/tools?resource=mfa                         (enabled status only)
//   POST   /api/admin/tools?resource=mfa&action=setup             (new pending secret + QR)
//   POST   /api/admin/tools?resource=mfa&action=confirm            (activate pending secret)
//   POST   /api/admin/tools?resource=mfa&action=disable             (requires a valid code)
//
// MFA note: this endpoint requires an already-valid admin SESSION cookie (rejectIfUnauthorized
// below), same as every other resource here — it's for managing MFA once logged in, never for
// logging in itself. The actual login-time TOTP challenge lives in api/admin/login.ts, which is
// a separate file because it must work with NO session cookie yet (that's the whole point).
//
// Vercel's Hobby plan caps a deployment at 12 serverless functions. At the time this was added the
// project was already at 11 (see the careers-routing-fix commit for the story of what broke when
// an earlier consolidation used path segments instead of query params) — this leaves zero headroom,
// so four distinct admin concerns share one file deliberately. Any future admin feature needs to
// either extend this file or free up a function elsewhere, not add a new one outright.
//
// Documents: uploads arrive as a JSON body ({ fileName, mimeType, base64Data }) rather than
// multipart/form-data, because Vercel Node functions don't parse multipart bodies without an extra
// dependency (busboy/formidable) this project doesn't otherwise need. Base64 inflates size by ~33%,
// so the enforced raw-file cap here (3MB) is well under both the bucket's 4MB limit and Vercel's
// ~4.5MB request body ceiling on Hobby.

const SIGNED_URL_TTL_SECONDS = 300;
const MAX_DOCUMENT_BYTES = 3 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DEFAULT_TEMPLATES: Record<string, { subject: string; intro: string }> = {
  enquiry: { subject: 'New Kamosa Website Enquiry', intro: '' },
  quote_request: { subject: 'New Quote Request', intro: '' },
  service_request: { subject: 'New Service Request', intro: '' },
  job_application: { subject: 'New Job Application: {{role}}', intro: '' },
  application_status_update: { subject: 'Update on your application for {{role}}', intro: '' }
};

const DEFAULT_RECIPIENT_EMAIL = 'info@kamosa.co.za';

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

type ServiceClient = ReturnType<typeof getServiceClient>;

// --- Reports (read-only, no new table — aggregates existing data) ---

async function getReports(res: VercelResponse, supabase: ServiceClient) {
  const [enquiries, applications, postings] = await Promise.all([
    supabase.from('enquiries').select('type, status, created_at'),
    supabase.from('job_applications').select('status'),
    supabase.from('job_postings').select('status')
  ]);

  if (enquiries.error || applications.error || postings.error) {
    return res.status(500).json({ error: 'Failed to load reports' });
  }

  const enquiryRows = enquiries.data ?? [];
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  const enquiriesByStatus: Record<string, number> = {};
  const enquiriesByType: Record<string, number> = {};
  let enquiriesLast30Days = 0;
  for (const row of enquiryRows) {
    enquiriesByStatus[row.status] = (enquiriesByStatus[row.status] ?? 0) + 1;
    enquiriesByType[row.type] = (enquiriesByType[row.type] ?? 0) + 1;
    if (new Date(row.created_at).getTime() >= thirtyDaysAgo) enquiriesLast30Days += 1;
  }

  const applicationsByStatus: Record<string, number> = {};
  for (const row of applications.data ?? []) {
    applicationsByStatus[row.status] = (applicationsByStatus[row.status] ?? 0) + 1;
  }

  const postingsByStatus: Record<string, number> = {};
  for (const row of postings.data ?? []) {
    postingsByStatus[row.status] = (postingsByStatus[row.status] ?? 0) + 1;
  }

  return res.status(200).json({
    enquiries: { total: enquiryRows.length, last30Days: enquiriesLast30Days, byStatus: enquiriesByStatus, byType: enquiriesByType },
    applications: { total: (applications.data ?? []).length, byStatus: applicationsByStatus },
    postings: { total: (postings.data ?? []).length, byStatus: postingsByStatus }
  });
}

// --- Documents (private Supabase Storage bucket, no DB table needed) ---

async function listDocuments(res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase.storage
    .from('admin-documents')
    .list('', { sortBy: { column: 'created_at', order: 'desc' } });

  if (error) {
    return res.status(500).json({ error: 'Failed to load documents' });
  }

  const files = (data ?? []).filter((f) => f.id);
  const documents = await Promise.all(
    files.map(async (f) => {
      const { data: signed } = await supabase.storage.from('admin-documents').createSignedUrl(f.name, SIGNED_URL_TTL_SECONDS);
      return {
        path: f.name,
        sizeBytes: f.metadata?.size ?? null,
        createdAt: f.created_at,
        url: signed?.signedUrl ?? null
      };
    })
  );

  return res.status(200).json({ documents });
}

async function uploadDocument(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const fileName = String(body?.fileName ?? '').trim();
  const mimeType = String(body?.mimeType ?? 'application/octet-stream');
  const base64Data = String(body?.base64Data ?? '');

  if (!fileName || !base64Data) {
    return res.status(400).json({ error: 'fileName and base64Data are required' });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid file data' });
  }

  if (buffer.length === 0 || buffer.length > MAX_DOCUMENT_BYTES) {
    return res.status(400).json({ error: 'File must be between 1 byte and 3MB' });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const path = `${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from('admin-documents').upload(path, buffer, {
    contentType: mimeType,
    upsert: false
  });

  if (error) {
    return res.status(500).json({ error: 'Failed to upload document' });
  }

  return res.status(201).json({ path });
}

async function deleteDocument(path: string, res: VercelResponse, supabase: ServiceClient) {
  const { error } = await supabase.storage.from('admin-documents').remove([path]);
  if (error) {
    return res.status(500).json({ error: 'Failed to delete document' });
  }
  return res.status(200).json({ path });
}

// --- Email Templates ---

async function listTemplates(res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase.from('email_templates').select('type, subject, intro');
  if (error) {
    return res.status(500).json({ error: 'Failed to load email templates' });
  }

  const byType = Object.fromEntries((data ?? []).map((row) => [row.type, row]));
  const templates = Object.keys(DEFAULT_TEMPLATES).map((type) => ({
    type,
    subject: byType[type]?.subject ?? DEFAULT_TEMPLATES[type].subject,
    intro: byType[type]?.intro ?? DEFAULT_TEMPLATES[type].intro,
    isCustom: Boolean(byType[type])
  }));

  return res.status(200).json({ templates });
}

async function updateTemplate(type: string, req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  if (!Object.keys(DEFAULT_TEMPLATES).includes(type)) {
    return res.status(400).json({ error: 'Unknown template type' });
  }

  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const subject = String(body?.subject ?? '').trim();
  const intro = body?.intro !== undefined ? String(body.intro).trim() : '';

  if (!subject) {
    return res.status(400).json({ error: 'Subject is required' });
  }

  const { data, error } = await supabase
    .from('email_templates')
    .upsert({ type, subject, intro: intro || null }, { onConflict: 'type' })
    .select()
    .single();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to update template' });
  }

  return res.status(200).json({ template: data });
}

async function resetTemplate(type: string, res: VercelResponse, supabase: ServiceClient) {
  if (!Object.keys(DEFAULT_TEMPLATES).includes(type)) {
    return res.status(400).json({ error: 'Unknown template type' });
  }

  const { error } = await supabase.from('email_templates').delete().eq('type', type);
  if (error) {
    return res.status(500).json({ error: 'Failed to reset template' });
  }

  return res.status(200).json({ template: { type, ...DEFAULT_TEMPLATES[type], isCustom: false } });
}

// --- Settings ---

// The four admin-notification categories a lead can trigger — kept distinct from
// application_status_update (the applicant-facing email), which isn't an admin notification and
// has no toggle. Keys mirror api/_lib/notifyEmail.ts's NotificationType values exactly.
const NOTIFICATION_CATEGORIES = ['enquiry', 'quote_request', 'service_request', 'job_application'] as const;
const categorySettingKey = (type: string) => `notify_${type}_enabled`;

async function getSettings(res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) {
    return res.status(500).json({ error: 'Failed to load settings' });
  }

  const byKey = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  const notificationCategories = Object.fromEntries(
    NOTIFICATION_CATEGORIES.map((type) => [type, byKey[categorySettingKey(type)] !== 'false'])
  );

  return res.status(200).json({
    notificationRecipientEmail: byKey.notification_recipient_email ?? DEFAULT_RECIPIENT_EMAIL,
    emailNotificationsConfigured: Boolean(process.env.RESEND_API_KEY),
    notificationCategories
  });
}

async function updateSettings(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const email = String(body?.notificationRecipientEmail ?? '').trim();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid notification recipient email is required' });
  }

  const rows = [{ key: 'notification_recipient_email', value: email }];

  const categories = body?.notificationCategories;
  if (categories && typeof categories === 'object') {
    for (const type of NOTIFICATION_CATEGORIES) {
      const value = (categories as Record<string, unknown>)[type];
      if (typeof value === 'boolean') {
        rows.push({ key: categorySettingKey(type), value: value ? 'true' : 'false' });
      }
    }
  }

  const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });

  if (error) {
    return res.status(500).json({ error: 'Failed to update settings' });
  }

  return res.status(200).json({ notificationRecipientEmail: email });
}

async function sendTestNotification(res: VercelResponse, supabase: ServiceClient) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'RESEND_API_KEY is not configured — nothing to test.' });
  }

  const { data } = await supabase.from('site_settings').select('value').eq('key', 'notification_recipient_email').maybeSingle();
  const recipient = data?.value || DEFAULT_RECIPIENT_EMAIL;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Kamosa Website <notifications@kamosa.co.za>',
        to: [recipient],
        subject: 'Kamosa Admin — Test Notification',
        html: '<p>This is a test notification sent from the Kamosa admin Settings page. If you received this, email notifications are working correctly.</p>'
      })
    });

    // Unlike notifyByEmail (which must never block a lead submission on a mail failure), this is
    // an explicit "Send Test Email" button — the admin clicked it specifically to find out whether
    // it works, so the real Resend response status is what gets reported back, not an optimistic
    // "request was sent."
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return res.status(502).json({ error: `Resend rejected the test email (HTTP ${response.status}).`, detail });
    }

    return res.status(200).json({ sentTo: recipient });
  } catch (err) {
    return res.status(502).json({ error: err instanceof Error ? err.message : 'Could not reach Resend.' });
  }
}

// --- Company information (phone, WhatsApp number, email, tagline) + homepage SEO overrides ---
// These mirror the hardcoded defaults in src/data/company.ts exactly — that file remains the
// fallback the public site falls back to (via CompanyContext) if no override is set or the fetch
// fails, so an empty site_settings table never breaks the live site. Only a small, named allow-list
// of fields is editable here — company registration number, CSD number, and similar facts stay
// code-only per docs/DECISIONS.md's "don't assume a new fact, preserve existing values" posture.
const COMPANY_INFO_DEFAULTS = {
  phone: '071 191 4744',
  whatsappNumber: '27711914744',
  email: 'info@kamosa.co.za',
  tagline: 'Building Trust Through Professional Excellence'
};
const PHONE_RE = /^[0-9+()\s-]{7,20}$/;
const WHATSAPP_RE = /^[0-9]{10,15}$/;

async function getCompanyInfo(res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['company_phone', 'company_whatsapp_number', 'company_email', 'company_tagline', 'homepage_seo_title', 'homepage_seo_description']);

  if (error) {
    return res.status(500).json({ error: 'Failed to load company information' });
  }

  const byKey = Object.fromEntries((data ?? []).map((row) => [row.key, row.value]));
  return res.status(200).json({
    phone: byKey.company_phone ?? COMPANY_INFO_DEFAULTS.phone,
    whatsappNumber: byKey.company_whatsapp_number ?? COMPANY_INFO_DEFAULTS.whatsappNumber,
    email: byKey.company_email ?? COMPANY_INFO_DEFAULTS.email,
    tagline: byKey.company_tagline ?? COMPANY_INFO_DEFAULTS.tagline,
    homepageSeoTitle: byKey.homepage_seo_title ?? '',
    homepageSeoDescription: byKey.homepage_seo_description ?? ''
  });
}

async function updateCompanyInfo(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const phone = String(body?.phone ?? '').trim();
  const whatsappNumber = String(body?.whatsappNumber ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const tagline = String(body?.tagline ?? '').trim();
  const homepageSeoTitle = String(body?.homepageSeoTitle ?? '').trim();
  const homepageSeoDescription = String(body?.homepageSeoDescription ?? '').trim();

  if (!PHONE_RE.test(phone)) return res.status(400).json({ error: 'Please enter a valid phone number.' });
  if (!WHATSAPP_RE.test(whatsappNumber)) return res.status(400).json({ error: 'WhatsApp number must be digits only, with country code (e.g. 27711914744).' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  if (!tagline) return res.status(400).json({ error: 'Tagline is required.' });
  if (homepageSeoTitle.length > 70) return res.status(400).json({ error: 'Homepage SEO title should be 70 characters or fewer.' });
  if (homepageSeoDescription.length > 160) return res.status(400).json({ error: 'Homepage SEO description should be 160 characters or fewer.' });

  const { error } = await supabase.from('site_settings').upsert(
    [
      { key: 'company_phone', value: phone },
      { key: 'company_whatsapp_number', value: whatsappNumber },
      { key: 'company_email', value: email },
      { key: 'company_tagline', value: tagline },
      { key: 'homepage_seo_title', value: homepageSeoTitle },
      { key: 'homepage_seo_description', value: homepageSeoDescription }
    ],
    { onConflict: 'key' }
  );

  if (error) {
    return res.status(500).json({ error: 'Failed to update company information' });
  }

  return res.status(200).json({ phone, whatsappNumber, email, tagline, homepageSeoTitle, homepageSeoDescription });
}

// --- MFA enrollment (the login-time challenge itself lives in api/admin/login.ts) ---

function verifyTotpCode(secretBase32: string, code: string): boolean {
  const totp = new TOTP({ secret: Secret.fromBase32(secretBase32), digits: 6, period: 30 });
  return totp.validate({ token: code, window: 1 }) !== null;
}

async function getMfaStatus(res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase.from('site_settings').select('key').eq('key', 'admin_mfa_secret').maybeSingle();
  if (error) {
    return res.status(500).json({ error: 'Failed to load MFA status' });
  }
  return res.status(200).json({ enabled: Boolean(data) });
}

async function setupMfa(res: VercelResponse, supabase: ServiceClient) {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({ issuer: 'Kamosa (Pty) Ltd', label: 'Admin', secret });
  const qrDataUrl = await QRCode.toDataURL(totp.toString());

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key: 'admin_mfa_pending_secret', value: secret.base32 }, { onConflict: 'key' });

  if (error) {
    return res.status(500).json({ error: 'Failed to start MFA setup' });
  }

  return res.status(200).json({ secret: secret.base32, qrDataUrl });
}

async function confirmMfa(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  const code = String(body?.code ?? '').trim();

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'admin_mfa_pending_secret')
    .maybeSingle();

  if (error || !data?.value) {
    return res.status(400).json({ error: 'No MFA setup in progress. Please start over.' });
  }

  if (!verifyTotpCode(data.value, code)) {
    return res.status(400).json({ error: 'Incorrect code. Please check your authenticator app and try again.' });
  }

  const { error: upsertError } = await supabase
    .from('site_settings')
    .upsert({ key: 'admin_mfa_secret', value: data.value }, { onConflict: 'key' });

  if (upsertError) {
    return res.status(500).json({ error: 'Failed to enable MFA' });
  }

  await supabase.from('site_settings').delete().eq('key', 'admin_mfa_pending_secret');

  return res.status(200).json({ enabled: true });
}

async function disableMfa(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  const code = String(body?.code ?? '').trim();

  const { data, error } = await supabase.from('site_settings').select('value').eq('key', 'admin_mfa_secret').maybeSingle();
  if (error || !data?.value) {
    return res.status(400).json({ error: 'MFA is not currently enabled' });
  }

  if (!verifyTotpCode(data.value, code)) {
    return res.status(400).json({ error: 'Incorrect code' });
  }

  const { error: deleteError } = await supabase.from('site_settings').delete().eq('key', 'admin_mfa_secret');
  if (deleteError) {
    return res.status(500).json({ error: 'Failed to disable MFA' });
  }

  return res.status(200).json({ enabled: false });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  let supabase: ServiceClient;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const resource = typeof req.query.resource === 'string' ? req.query.resource : undefined;

  if (resource === 'reports') {
    if (req.method === 'GET') return getReports(res, supabase);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (resource === 'documents') {
    const path = typeof req.query.path === 'string' ? req.query.path : undefined;
    if (req.method === 'GET') return listDocuments(res, supabase);
    if (req.method === 'POST') return uploadDocument(req, res, supabase);
    if (req.method === 'DELETE') {
      if (!path) return res.status(400).json({ error: 'Missing path' });
      return deleteDocument(path, res, supabase);
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (resource === 'email-templates') {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    if (req.method === 'GET') return listTemplates(res, supabase);
    if (req.method === 'PATCH') {
      if (!type) return res.status(400).json({ error: 'Missing type' });
      return updateTemplate(type, req, res, supabase);
    }
    if (req.method === 'DELETE') {
      if (!type) return res.status(400).json({ error: 'Missing type' });
      return resetTemplate(type, res, supabase);
    }
    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (resource === 'settings') {
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    if (req.method === 'POST' && action === 'test') return sendTestNotification(res, supabase);
    if (req.method === 'GET') return getSettings(res, supabase);
    if (req.method === 'PATCH') return updateSettings(req, res, supabase);
    res.setHeader('Allow', 'GET, PATCH, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (resource === 'company-info') {
    if (req.method === 'GET') return getCompanyInfo(res, supabase);
    if (req.method === 'PATCH') return updateCompanyInfo(req, res, supabase);
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (resource === 'mfa') {
    const action = typeof req.query.action === 'string' ? req.query.action : undefined;
    if (req.method === 'GET' && !action) return getMfaStatus(res, supabase);
    if (req.method === 'POST' && action === 'setup') return setupMfa(res, supabase);
    if (req.method === 'POST' && action === 'confirm') return confirmMfa(req, res, supabase);
    if (req.method === 'POST' && action === 'disable') return disableMfa(req, res, supabase);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(400).json({ error: 'Unknown resource' });
}
