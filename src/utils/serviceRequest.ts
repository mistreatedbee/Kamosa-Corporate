export interface ServiceRequestPayload {
  name: string;
  email: string;
  phone: string;
  serviceSlug: string;
  description: string;
}

export type ServiceRequestResult = { status: 'sent' } | { status: 'error'; message: string };

const SERVICE_REQUEST_ENDPOINT = '/api/service-request';

export function validateServiceRequest(payload: ServiceRequestPayload): Partial<Record<keyof ServiceRequestPayload, string>> {
  const errors: Partial<Record<keyof ServiceRequestPayload, string>> = {};
  if (!payload.name.trim()) errors.name = 'Please enter your name.';
  if (!payload.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (payload.phone.trim() && !/^[0-9+()\s-]{7,20}$/.test(payload.phone.trim())) {
    errors.phone = 'Please enter a valid telephone number.';
  }
  if (!payload.serviceSlug) errors.serviceSlug = 'Please select the service you require.';
  if (payload.description.trim().length < 10) {
    errors.description = 'Please provide a short description (10 characters or more).';
  }
  return errors;
}

export async function submitServiceRequest(
  payload: ServiceRequestPayload,
  antiSpam: { website: string; formRenderedAt: number }
): Promise<ServiceRequestResult> {
  try {
    const response = await fetch(SERVICE_REQUEST_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ...antiSpam })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.status === 'error') {
      return { status: 'error', message: data?.message || 'We could not submit your request. Please try again or contact us directly.' };
    }
    return { status: 'sent' };
  } catch {
    return { status: 'error', message: 'A network error prevented submission. Please try again or contact us directly.' };
  }
}
