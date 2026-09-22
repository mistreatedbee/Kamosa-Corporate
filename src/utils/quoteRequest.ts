export type QuoteCategory = 'health_safety' | 'training' | 'procurement' | 'other';

export interface QuoteRequestFormValues {
  category: QuoteCategory | '';
  serviceSlug: string;
  // Health & Safety
  siteType: string;
  workerCount: string;
  duration: string;
  hsLocation: string;
  docsNeeded: string;
  complianceStatus: string;
  // Training
  course: string;
  participantCount: string;
  preferredDate: string;
  trainingLocation: string;
  organisationType: string;
  // Procurement
  productCategory: string;
  quantity: string;
  deliveryLocation: string;
  neededBy: string;
  // Other (Consulting / Environmental)
  freeText: string;
  // Contact
  name: string;
  company: string;
  email: string;
  phone: string;
}

export const QUOTE_FORM_DEFAULTS: QuoteRequestFormValues = {
  category: '',
  serviceSlug: '',
  siteType: '',
  workerCount: '',
  duration: '',
  hsLocation: '',
  docsNeeded: '',
  complianceStatus: '',
  course: '',
  participantCount: '',
  preferredDate: '',
  trainingLocation: '',
  organisationType: '',
  productCategory: '',
  quantity: '',
  deliveryLocation: '',
  neededBy: '',
  freeText: '',
  name: '',
  company: '',
  email: '',
  phone: ''
};

export type QuoteRequestResult = { status: 'sent' } | { status: 'error'; message: string };

function buildDetails(values: QuoteRequestFormValues): Record<string, unknown> {
  switch (values.category) {
    case 'health_safety':
      return {
        site_type: values.siteType,
        worker_count: values.workerCount,
        duration: values.duration,
        location: values.hsLocation,
        docs_needed: values.docsNeeded,
        compliance_status: values.complianceStatus
      };
    case 'training':
      return {
        course: values.course,
        participant_count: values.participantCount,
        preferred_date: values.preferredDate,
        location: values.trainingLocation,
        organisation: values.organisationType
      };
    case 'procurement':
      return {
        product_category: values.productCategory,
        quantity: values.quantity,
        delivery_location: values.deliveryLocation,
        needed_by: values.neededBy
      };
    default:
      return {};
  }
}

export async function submitQuoteRequest(
  values: QuoteRequestFormValues,
  antiSpam: { website: string; formRenderedAt: number }
): Promise<QuoteRequestResult> {
  try {
    const response = await fetch('/api/quote-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        company: values.company,
        email: values.email,
        phone: values.phone,
        category: values.category,
        serviceSlug: values.serviceSlug,
        details: buildDetails(values),
        freeText: values.freeText,
        ...antiSpam
      })
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
