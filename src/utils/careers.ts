import { supabase } from '../lib/supabaseClient';

export interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  location: string;
  employment_type: string;
  summary: string;
  requirements: string[];
  responsibilities: string[];
  closing_date: string | null;
  created_at: string;
}

export interface ApplicationPayload {
  name: string;
  email: string;
  phone: string;
  coverMessage: string;
}

export type ApplicationResult =
  | { status: 'sent' }
  | { status: 'error'; message: string };

const MAX_CV_BYTES = 5 * 1024 * 1024;
const ALLOWED_CV_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export function validateApplication(
  payload: ApplicationPayload,
  cvFile: File | null
): Partial<Record<keyof ApplicationPayload | 'cv', string>> {
  const errors: Partial<Record<keyof ApplicationPayload | 'cv', string>> = {};

  if (!payload.name.trim()) errors.name = 'Please enter your name.';
  if (!payload.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (payload.phone.trim() && !/^[0-9+()\s-]{7,20}$/.test(payload.phone.trim())) {
    errors.phone = 'Please enter a valid telephone number.';
  }

  if (!cvFile) {
    errors.cv = 'Please attach your CV.';
  } else if (!ALLOWED_CV_TYPES.includes(cvFile.type)) {
    errors.cv = 'CV must be a PDF or Word document.';
  } else if (cvFile.size > MAX_CV_BYTES) {
    errors.cv = 'CV must be 5MB or smaller.';
  }

  return errors;
}

export async function fetchOpenJobPostings(): Promise<JobPosting[]> {
  const response = await fetch('/api/careers');
  if (!response.ok) return [];
  const data = await response.json().catch(() => null);
  return data?.postings ?? [];
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export async function submitApplication(
  jobPostingId: string,
  payload: ApplicationPayload,
  cvFile: File,
  antiSpam: { website: string; formRenderedAt: number }
): Promise<ApplicationResult> {
  if (!supabase) {
    return { status: 'error', message: 'Applications are temporarily unavailable. Please try again later.' };
  }

  const storagePath = `${jobPostingId}/${Date.now()}-${sanitizeFileName(cvFile.name)}`;

  const { error: uploadError } = await supabase.storage.from('cv-uploads').upload(storagePath, cvFile, {
    contentType: cvFile.type,
    upsert: false
  });

  if (uploadError) {
    return { status: 'error', message: 'We could not upload your CV. Please try again.' };
  }

  try {
    const response = await fetch('/api/careers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobPostingId,
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        coverMessage: payload.coverMessage,
        cvStoragePath: storagePath,
        cvFileName: cvFile.name,
        ...antiSpam
      })
    });

    if (!response.ok && response.status !== 429) {
      return { status: 'error', message: 'We could not submit your application. Please try again or contact us directly.' };
    }

    const data = await response.json().catch(() => null);
    if (data?.status === 'error') {
      return {
        status: 'error',
        message: data.message || 'We could not submit your application. Please try again or contact us directly.'
      };
    }

    return { status: 'sent' };
  } catch {
    return { status: 'error', message: 'A network error prevented submission. Please try again or contact us directly.' };
  }
}
