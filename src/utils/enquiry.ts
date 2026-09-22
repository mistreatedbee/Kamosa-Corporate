export interface EnquiryPayload {
  name: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  message: string;
}

export type EnquiryResult =
{status: 'sent';} |
{status: 'error';message: string;};

/** Serverless function (Vercel) backing enquiry submissions — see /api/enquiry.ts. */
const ENQUIRY_ENDPOINT = '/api/enquiry';

export async function submitEnquiry(
  payload: EnquiryPayload,
  antiSpam: { website: string; formRenderedAt: number }
): Promise<EnquiryResult> {
  try {
    const response = await fetch(ENQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...antiSpam })
    });

    if (!response.ok && response.status !== 429) {
      return { status: 'error', message: 'We could not submit your enquiry. Please try again or contact us directly.' };
    }

    const data = await response.json().catch(() => null);
    if (data?.status === 'error') {
      return { status: 'error', message: data.message || 'We could not submit your enquiry. Please try again or contact us directly.' };
    }

    return { status: 'sent' };
  } catch {
    return {
      status: 'error',
      message: 'A network error prevented submission. Please try again or contact us directly.'
    };
  }
}

export function validateEnquiry(payload: EnquiryPayload): Partial<Record<keyof EnquiryPayload, string>> {
  const errors: Partial<Record<keyof EnquiryPayload, string>> = {};

  if (!payload.name.trim()) errors.name = 'Please enter your name.';
  if (!payload.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (payload.phone.trim() && !/^[0-9+()\s-]{7,20}$/.test(payload.phone.trim())) {
    errors.phone = 'Please enter a valid telephone number.';
  }
  if (!payload.service) errors.service = 'Please select the service you require.';
  if (payload.message.trim().length < 20) {
    errors.message = 'Please provide at least a short description of your requirement (20 characters or more).';
  }

  return errors;
}