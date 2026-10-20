import { supabase } from '../lib/supabaseClient';
import type { DocumentType, JobPosting } from '../types/careers';

export type { JobPosting };

export interface ApplicationPayload {
  name: string;
  email: string;
  phone: string;
  coverMessage: string;
}

export interface ScreeningAnswer {
  questionId: string;
  label: string;
  answer: string;
}

export type ApplicationResult =
  | { status: 'sent'; referenceCode?: string }
  | { status: 'error'; message: string };

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export function validateApplication(
  payload: ApplicationPayload,
  cvFile: File | null,
  extraDocuments: Partial<Record<DocumentType, File | null>> = {},
  requiredDocuments: DocumentType[] = ['cv'],
  consent = false
): Partial<Record<keyof ApplicationPayload | 'cv' | 'consent' | DocumentType, string>> {
  const errors: Partial<Record<keyof ApplicationPayload | 'cv' | 'consent' | DocumentType, string>> = {};

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
  } else if (!ALLOWED_DOCUMENT_TYPES.includes(cvFile.type)) {
    errors.cv = 'CV must be a PDF or Word document.';
  } else if (cvFile.size > MAX_FILE_BYTES) {
    errors.cv = 'CV must be 5MB or smaller.';
  }

  for (const docType of requiredDocuments) {
    if (docType === 'cv') continue;
    const file = extraDocuments[docType];
    if (!file) {
      errors[docType] = 'This document is required.';
    } else if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      errors[docType] = 'Must be a PDF or Word document.';
    } else if (file.size > MAX_FILE_BYTES) {
      errors[docType] = 'Must be 5MB or smaller.';
    }
  }

  if (!consent) errors.consent = 'Please confirm you agree to the privacy notice.';

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

async function uploadDocument(jobPostingId: string, file: File): Promise<{ storagePath: string; fileName: string } | null> {
  if (!supabase) return null;
  const storagePath = `${jobPostingId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from('cv-uploads').upload(storagePath, file, {
    contentType: file.type,
    upsert: false
  });
  if (error) return null;
  return { storagePath, fileName: file.name };
}

export async function submitApplication(
  jobPostingId: string,
  payload: ApplicationPayload,
  cvFile: File,
  extraDocuments: Partial<Record<DocumentType, File>>,
  answers: ScreeningAnswer[],
  consent: boolean,
  antiSpam: { website: string; formRenderedAt: number }
): Promise<ApplicationResult> {
  if (!supabase) {
    return { status: 'error', message: 'Applications are temporarily unavailable. Please try again later.' };
  }

  const cvUpload = await uploadDocument(jobPostingId, cvFile);
  if (!cvUpload) {
    return { status: 'error', message: 'We could not upload your CV. Please try again.' };
  }

  const documents: Array<{ type: DocumentType; storagePath: string; fileName: string }> = [];
  for (const [type, file] of Object.entries(extraDocuments) as Array<[DocumentType, File | undefined]>) {
    if (!file) continue;
    const uploaded = await uploadDocument(jobPostingId, file);
    if (!uploaded) {
      return { status: 'error', message: `We could not upload your ${type.replace('_', ' ')}. Please try again.` };
    }
    documents.push({ type, ...uploaded });
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
        cvStoragePath: cvUpload.storagePath,
        cvFileName: cvUpload.fileName,
        documents,
        answers,
        consent,
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

    return { status: 'sent', referenceCode: data?.referenceCode };
  } catch {
    return { status: 'error', message: 'A network error prevented submission. Please try again or contact us directly.' };
  }
}
