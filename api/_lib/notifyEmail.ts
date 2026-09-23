// Shared email notification helper for all lead-capture endpoints (enquiry, quote-request,
// service-request). Gated entirely on RESEND_API_KEY: absent -> silent no-op (the lead is still
// safely in Postgres either way), present -> sends. This means activating notifications later is
// a single env var, not a code change — per docs/DECISIONS.md's CTO-directed priority: the lead
// capture path must not depend on anyone remembering to ship a follow-up PR.
//
// Never let a mail failure fail the lead insert — the insert already happened by the time this
// runs; a broken notification should never look like a broken submission to the visitor.

interface NotifyParams {
  subject: string;
  lines: Array<{ label: string; value: string }>;
}

const NOTIFICATION_RECIPIENT = 'info@kamosa.co.za';
// Resend requires a verified sending domain; until Kamosa verifies kamosa.co.za with Resend, their
// own sandbox "onboarding@resend.dev" sender works for testing but should be swapped once a real
// domain is verified. Kept as a constant here so that's a one-line change when it happens.
const NOTIFICATION_SENDER = 'Kamosa Website <onboarding@resend.dev>';

export async function notifyByEmail(params: NotifyParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Not configured yet — silent no-op by design. The lead itself is already safely in Postgres.
    return;
  }

  const html = `
    <div style="font-family: sans-serif; font-size: 14px; color: #353535;">
      <h2 style="margin: 0 0 16px;">${escapeHtml(params.subject)}</h2>
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
        to: [NOTIFICATION_RECIPIENT],
        subject: params.subject,
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
