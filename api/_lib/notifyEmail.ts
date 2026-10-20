import { createClient } from '@supabase/supabase-js';

// Shared email notification helper for all lead-capture endpoints (enquiry, quote-request,
// service-request, careers). Gated entirely on RESEND_API_KEY: absent -> silent no-op (the lead is
// still safely in Postgres either way), present -> sends. This means activating notifications is a
// single env var, not a code change — per docs/DECISIONS.md's CTO-directed priority: the lead
// capture path must not depend on anyone remembering to ship a follow-up PR.
//
// Never let a mail failure fail the lead insert — the insert already happened by the time this
// runs; a broken notification should never look like a broken submission to the visitor. The same
// rule now extends to the optional admin-editable subject/intro/recipient lookup added below: any
// failure to reach email_templates / site_settings falls back to the caller's defaults rather than
// blocking the send, exactly like a Resend failure itself is swallowed.

const DEFAULT_RECIPIENT = 'info@kamosa.co.za';
const NOTIFICATION_SENDER = 'Kamosa Website <notifications@kamosa.co.za>';

export type NotificationType = 'enquiry' | 'quote_request' | 'service_request' | 'job_application' | 'application_status_update';

interface NotifyParams {
  type: NotificationType;
  /** Default subject, used unless an admin has set a custom one in Email Templates. */
  subject: string;
  lines: Array<{ label: string; value: string }>;
  /** {{key}} tokens in a custom subject/intro are substituted from this map. */
  vars?: Record<string, string>;
  /** Overrides the admin-notification-recipient lookup — for applicant-facing emails
   * (application_status_update), sent to a specific person, not the shared admin inbox. */
  to?: string;
}

function substitute(text: string, vars: Record<string, string> | undefined): string {
  if (!vars) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
}

async function loadOverrides(type: NotificationType): Promise<{ subject?: string; intro?: string; recipient?: string }> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return {};

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const [templateResult, settingResult] = await Promise.all([
      supabase.from('email_templates').select('subject, intro').eq('type', type).maybeSingle(),
      supabase.from('site_settings').select('value').eq('key', 'notification_recipient_email').maybeSingle()
    ]);

    return {
      subject: templateResult.data?.subject ?? undefined,
      intro: templateResult.data?.intro ?? undefined,
      recipient: settingResult.data?.value ?? undefined
    };
  } catch {
    return {};
  }
}

export async function notifyByEmail(params: NotifyParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Not configured yet — silent no-op by design. The lead itself is already safely in Postgres.
    return;
  }

  const overrides = await loadOverrides(params.type);
  const subject = substitute(overrides.subject || params.subject, params.vars);
  const intro = overrides.intro ? substitute(overrides.intro, params.vars) : undefined;
  const recipient = params.to || overrides.recipient || DEFAULT_RECIPIENT;

  const html = `
    <div style="font-family: sans-serif; font-size: 14px; color: #353535;">
      <h2 style="margin: 0 0 16px;">${escapeHtml(subject)}</h2>
      ${intro ? `<p style="margin: 0 0 16px;">${escapeHtml(intro)}</p>` : ''}
      <table cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${params.lines
          .map(
            (line) => `
          <tr>
            <td style="padding: 4px 12px 4px 0; font-weight: 600; vertical-align: top; white-space: nowrap;">${escapeHtml(line.label)}</td>
            <td style="padding: 4px 0;">${escapeHtml(line.value)}</td>
          </tr>`
          )
          .join('')}
      </table>
    </div>
  `.trim();

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: NOTIFICATION_SENDER,
        to: [recipient],
        subject,
        html
      })
    });
    // Response status intentionally not checked further than "the request was sent" — a failed
    // notification must never surface as a failed lead submission. If this needs monitoring later,
    // log the response here rather than throwing.
  } catch {
    // Network/DNS/etc. failure reaching Resend — swallow. See file header comment for why.
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
