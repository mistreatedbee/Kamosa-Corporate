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
{status: 'unconfigured';} |
{status: 'error';message: string;};

/**
 * Endpoint for enquiry submissions.
 *
 * TODO — BACKEND INTEGRATION REQUIRED.
 * No submission endpoint exists yet. Until one is supplied, the form deliberately
 * does NOT claim an enquiry was delivered; it returns `unconfigured` and directs the
 * visitor to telephone or email instead. Set ENQUIRY_ENDPOINT to the live endpoint
 * and the "sent" path below becomes active with no other changes required.
 */
const ENQUIRY_ENDPOINT: string | null = null;

export async function submitEnquiry(payload: EnquiryPayload): Promise<EnquiryResult> {
  if (!ENQUIRY_ENDPOINT) {
    // Brief delay so the loading state is honest about work being attempted.
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { status: 'unconfigured' };
  }

  try {
    const response = await fetch(ENQUIRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return { status: 'error', message: 'We could not submit your enquiry. Please try again or contact us directly.' };
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