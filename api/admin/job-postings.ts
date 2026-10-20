import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { rejectIfUnauthorized } from '../_lib/adminSession.js';

// Combines admin job-posting list/create/update/delete, the per-posting applications list, and
// application notes into one flat function, dispatched by HTTP method plus query params — NOT
// path segments (see the careers-routing-fix commit for why: an optional catch-all route silently
// 404'd on the zero-segment base path in production):
//   GET    /api/admin/job-postings                                   list all postings
//   POST   /api/admin/job-postings                                    create
//   PATCH  /api/admin/job-postings?id=<postingId>                      update
//   DELETE /api/admin/job-postings?id=<postingId>                      delete
//   GET    /api/admin/job-postings?id=<postingId>&applications=1        applications for a posting
//   GET    /api/admin/job-postings?applicationId=<id>&notes=1            list notes on an application
//   POST   /api/admin/job-postings?applicationId=<id>&notes=1            add a note
//
// The session guard runs first, before anything else, on every branch.

const VALID_EMPLOYMENT_TYPES = [
  'Permanent',
  'Fixed-term Contract',
  'Temporary',
  'Part-time',
  'Full-time',
  'Internship',
  'Learnership',
  'Freelance'
];
const VALID_STATUSES = ['draft', 'open', 'paused', 'closed', 'archived'];
const VALID_WORK_ARRANGEMENTS = ['on-site', 'remote', 'hybrid'];
const VALID_SALARY_FREQUENCIES = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Annually'];
const VALID_DOCUMENT_TYPES = ['cv', 'cover_letter', 'certificates', 'portfolio', 'other'];
const VALID_APPLICATION_METHODS = ['website', 'email', 'external'];
const SIGNED_URL_TTL_SECONDS = 300;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY_LEGACY_JWT || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

type ServiceClient = ReturnType<typeof getServiceClient>;

function toLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

function toLinesOptional(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  return toLines(value);
}

function toNullableNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toNullableText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const text = String(value).trim();
  return text || null;
}

interface ScreeningQuestion {
  id: string;
  label: string;
  type: 'yesno' | 'text';
  required: boolean;
}

function toScreeningQuestions(value: unknown): ScreeningQuestion[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      const label = String((item as Record<string, unknown>)?.label ?? '').trim();
      if (!label) return null;
      const type = (item as Record<string, unknown>)?.type === 'text' ? 'text' : 'yesno';
      return {
        id: String((item as Record<string, unknown>)?.id ?? `q${index}`),
        label,
        type,
        required: Boolean((item as Record<string, unknown>)?.required)
      } satisfies ScreeningQuestion;
    })
    .filter((q): q is ScreeningQuestion => q !== null);
}

function toRequiredDocuments(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return ['cv'];
  const filtered = value.map((v) => String(v)).filter((v) => VALID_DOCUMENT_TYPES.includes(v));
  return filtered.length > 0 ? Array.from(new Set(filtered)) : ['cv'];
}

/** Builds the shared insert/update field map from a request body. Returns an error message string
 * if validation fails, or the field map otherwise — used by both create (all fields considered)
 * and update (only fields present in the body are touched). */
function buildPostingFields(body: Record<string, unknown>, { partial }: { partial: boolean }): Record<string, unknown> | string {
  const fields: Record<string, unknown> = {};

  if (!partial || body.title !== undefined) {
    const title = String(body.title ?? '').trim();
    if (!title) return 'Title is required';
    fields.title = title;
  }
  if (!partial || body.summary !== undefined) {
    const summary = String(body.summary ?? '').trim();
    if (!summary) return 'Summary is required';
    fields.summary = summary;
  }
  if (!partial || body.department !== undefined) fields.department = toNullableText(body.department);
  if (!partial || body.location !== undefined) fields.location = body.location ? String(body.location).trim() : 'South Africa';
  if (!partial || body.category !== undefined) fields.category = toNullableText(body.category);
  if (!partial || body.industry !== undefined) fields.industry = toNullableText(body.industry);
  if (!partial || body.vacancies !== undefined) {
    const vacancies = Number(body.vacancies ?? 1);
    fields.vacancies = Number.isFinite(vacancies) && vacancies >= 1 ? Math.floor(vacancies) : 1;
  }

  if (!partial || body.employmentType !== undefined) {
    const employmentType = String(body.employmentType ?? 'Full-time');
    if (!VALID_EMPLOYMENT_TYPES.includes(employmentType)) return `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}`;
    fields.employment_type = employmentType;
  }
  if (!partial || body.workArrangement !== undefined) {
    const workArrangement = String(body.workArrangement ?? 'on-site');
    if (!VALID_WORK_ARRANGEMENTS.includes(workArrangement)) return `workArrangement must be one of: ${VALID_WORK_ARRANGEMENTS.join(', ')}`;
    fields.work_arrangement = workArrangement;
  }
  if (!partial || body.status !== undefined) {
    const status = String(body.status ?? 'draft');
    if (!VALID_STATUSES.includes(status)) return `status must be one of: ${VALID_STATUSES.join(', ')}`;
    fields.status = status;
  }

  const requirements = toLinesOptional(body.requirements);
  if (requirements !== undefined) fields.requirements = requirements;
  const preferredRequirements = toLinesOptional(body.preferredRequirements);
  if (preferredRequirements !== undefined) fields.preferred_requirements = preferredRequirements;
  const responsibilities = toLinesOptional(body.responsibilities);
  if (responsibilities !== undefined) fields.responsibilities = responsibilities;
  const qualifications = toLinesOptional(body.qualifications);
  if (qualifications !== undefined) fields.qualifications = qualifications;
  const languages = toLinesOptional(body.languages);
  if (languages !== undefined) fields.languages = languages;
  const benefits = toLinesOptional(body.benefits);
  if (benefits !== undefined) fields.benefits = benefits;

  if (!partial || body.minExperienceYears !== undefined) {
    const years = toNullableNumber(body.minExperienceYears);
    fields.min_experience_years = years === undefined ? null : years;
  }
  if (!partial || body.educationLevel !== undefined) fields.education_level = toNullableText(body.educationLevel);
  if (!partial || body.workingHours !== undefined) fields.working_hours = toNullableText(body.workingHours);
  if (!partial || body.startDate !== undefined) fields.start_date = toNullableText(body.startDate);
  if (!partial || body.opensAt !== undefined) fields.opens_at = toNullableText(body.opensAt);
  if (!partial || body.closingDate !== undefined) fields.closing_date = toNullableText(body.closingDate);

  if (!partial || body.salaryMin !== undefined) fields.salary_min = toNullableNumber(body.salaryMin) ?? null;
  if (!partial || body.salaryMax !== undefined) fields.salary_max = toNullableNumber(body.salaryMax) ?? null;
  if (!partial || body.salaryCurrency !== undefined) fields.salary_currency = body.salaryCurrency ? String(body.salaryCurrency).trim() : 'ZAR';
  if (!partial || body.salaryPublic !== undefined) fields.salary_public = Boolean(body.salaryPublic);
  if (!partial || body.salaryNegotiable !== undefined) fields.salary_negotiable = Boolean(body.salaryNegotiable);
  if (!partial || body.salaryFrequency !== undefined) {
    const freq = body.salaryFrequency ? String(body.salaryFrequency) : null;
    if (freq && !VALID_SALARY_FREQUENCIES.includes(freq)) return `salaryFrequency must be one of: ${VALID_SALARY_FREQUENCIES.join(', ')}`;
    fields.salary_frequency = freq;
  }

  const requiredDocuments = toRequiredDocuments(body.requiredDocuments);
  if (requiredDocuments !== undefined) fields.required_documents = requiredDocuments;
  const screeningQuestions = toScreeningQuestions(body.screeningQuestions);
  if (screeningQuestions !== undefined) fields.screening_questions = screeningQuestions;

  if (!partial || body.applicationMethod !== undefined) {
    const method = String(body.applicationMethod ?? 'website');
    if (!VALID_APPLICATION_METHODS.includes(method)) return `applicationMethod must be one of: ${VALID_APPLICATION_METHODS.join(', ')}`;
    fields.application_method = method;
    if (method === 'email') {
      const email = String(body.applicationEmail ?? '').trim();
      if (!EMAIL_RE.test(email)) return 'A valid applicationEmail is required when applicationMethod is "email"';
      fields.application_email = email;
    }
    if (method === 'external') {
      const url = String(body.applicationUrl ?? '').trim();
      try {
        new URL(url);
      } catch {
        return 'A valid applicationUrl is required when applicationMethod is "external"';
      }
      fields.application_url = url;
    }
  }
  if (!partial || body.applicationInstructions !== undefined) fields.application_instructions = toNullableText(body.applicationInstructions);
  if (!partial || body.recruiterName !== undefined) fields.recruiter_name = toNullableText(body.recruiterName);
  if (!partial || body.recruiterEmail !== undefined) fields.recruiter_email = toNullableText(body.recruiterEmail);
  if (!partial || body.recruiterPhone !== undefined) fields.recruiter_phone = toNullableText(body.recruiterPhone);

  return fields;
}

async function listPostings(res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase
    .from('job_postings')
    .select('*, job_applications(count)')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to load job postings' });
  }

  const postings = (data ?? []).map((row) => {
    const { job_applications, ...rest } = row as typeof row & { job_applications: { count: number }[] };
    return { ...rest, application_count: job_applications?.[0]?.count ?? 0 };
  });

  return res.status(200).json({ postings });
}

async function createPosting(req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const fields = buildPostingFields(body, { partial: false });
  if (typeof fields === 'string') {
    return res.status(400).json({ error: fields });
  }

  const { data, error } = await supabase.from('job_postings').insert(fields).select().single();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to create job posting' });
  }

  return res.status(201).json({ posting: data });
}

async function updatePosting(id: string, req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const fields = buildPostingFields(body, { partial: true });
  if (typeof fields === 'string') {
    return res.status(400).json({ error: fields });
  }

  const { data, error } = await supabase.from('job_postings').update(fields).eq('id', id).select().single();

  if (error || !data) {
    return res.status(404).json({ error: 'Job posting not found or update failed' });
  }

  return res.status(200).json({ posting: data });
}

async function deletePosting(id: string, res: VercelResponse, supabase: ServiceClient) {
  const { error } = await supabase.from('job_postings').delete().eq('id', id);
  if (error) {
    return res.status(500).json({ error: 'Failed to delete job posting' });
  }
  return res.status(200).json({ id });
}

async function listApplications(jobPostingId: string, res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, status, name, email, phone, cover_message, cv_storage_path, cv_file_name, documents, answers, reference_code, created_at')
    .eq('job_posting_id', jobPostingId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to load applications' });
  }

  const applications = await Promise.all(
    (data ?? []).map(async (application) => {
      const { data: signed } = await supabase.storage
        .from('cv-uploads')
        .createSignedUrl(application.cv_storage_path, SIGNED_URL_TTL_SECONDS);

      const documents = Array.isArray(application.documents) ? application.documents : [];
      const documentUrls = await Promise.all(
        documents.map(async (doc: { type: string; storagePath: string; fileName: string }) => {
          const { data: docSigned } = await supabase.storage.from('cv-uploads').createSignedUrl(doc.storagePath, SIGNED_URL_TTL_SECONDS);
          return { type: doc.type, fileName: doc.fileName, url: docSigned?.signedUrl ?? null };
        })
      );

      return {
        id: application.id,
        status: application.status,
        name: application.name,
        email: application.email,
        phone: application.phone,
        cover_message: application.cover_message,
        cv_file_name: application.cv_file_name,
        cv_url: signed?.signedUrl ?? null,
        documents: documentUrls,
        answers: application.answers,
        reference_code: application.reference_code,
        created_at: application.created_at
      };
    })
  );

  return res.status(200).json({ applications });
}

async function listNotes(applicationId: string, res: VercelResponse, supabase: ServiceClient) {
  const { data, error } = await supabase
    .from('job_application_notes')
    .select('id, note, created_at')
    .eq('job_application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Failed to load notes' });
  }

  return res.status(200).json({ notes: data ?? [] });
}

async function addNote(applicationId: string, req: VercelRequest, res: VercelResponse, supabase: ServiceClient) {
  let body: Record<string, unknown>;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const note = String(body?.note ?? '').trim();
  if (!note) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  const { data, error } = await supabase
    .from('job_application_notes')
    .insert({ job_application_id: applicationId, note })
    .select()
    .single();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to add note' });
  }

  return res.status(201).json({ note: data });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (rejectIfUnauthorized(req, res)) return;

  let supabase: ServiceClient;
  try {
    supabase = getServiceClient();
  } catch {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id : undefined;
  const applicationId = typeof req.query.applicationId === 'string' ? req.query.applicationId : undefined;
  const wantsApplications = req.query.applications === '1' || req.query.applications === 'true';
  const wantsNotes = req.query.notes === '1' || req.query.notes === 'true';

  if (applicationId && wantsNotes) {
    if (req.method === 'GET') return listNotes(applicationId, res, supabase);
    if (req.method === 'POST') return addNote(applicationId, req, res, supabase);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id) {
    if (req.method === 'GET') return listPostings(res, supabase);
    if (req.method === 'POST') return createPosting(req, res, supabase);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (wantsApplications) {
    if (req.method === 'GET') return listApplications(id, res, supabase);
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'PATCH') return updatePosting(id, req, res, supabase);
  if (req.method === 'DELETE') return deletePosting(id, res, supabase);
  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
