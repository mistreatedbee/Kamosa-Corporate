export interface ScreeningQuestion {
  id: string;
  label: string;
  type: 'yesno' | 'text';
  required: boolean;
}

export const DOCUMENT_TYPES = ['cv', 'cover_letter', 'certificates', 'portfolio', 'other'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  cv: 'CV / résumé',
  cover_letter: 'Cover letter',
  certificates: 'Qualifications / certificates',
  portfolio: 'Portfolio / work samples',
  other: 'Other supporting document'
};

export const EMPLOYMENT_TYPES = [
  'Permanent',
  'Fixed-term Contract',
  'Temporary',
  'Part-time',
  'Full-time',
  'Internship',
  'Learnership',
  'Freelance'
] as const;

export const WORK_ARRANGEMENTS = ['on-site', 'remote', 'hybrid'] as const;
export type WorkArrangement = (typeof WORK_ARRANGEMENTS)[number];

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  'on-site': 'On-site',
  remote: 'Remote',
  hybrid: 'Hybrid'
};

export const SALARY_FREQUENCIES = ['Hourly', 'Daily', 'Weekly', 'Monthly', 'Annually'] as const;

export const POSTING_STATUSES = ['draft', 'open', 'paused', 'closed', 'archived'] as const;
export type PostingStatus = (typeof POSTING_STATUSES)[number];

export const POSTING_STATUS_LABELS: Record<PostingStatus, string> = {
  draft: 'Draft',
  open: 'Published',
  paused: 'Paused',
  closed: 'Closed',
  archived: 'Archived'
};

export const APPLICATION_METHODS = ['website', 'email', 'external'] as const;

/** Full posting shape as stored/returned by the API — snake_case, matches the DB columns. */
export interface JobPosting {
  id: string;
  title: string;
  department: string | null;
  location: string;
  category: string | null;
  industry: string | null;
  employment_type: string;
  work_arrangement: WorkArrangement;
  vacancies: number;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  preferred_requirements: string[];
  qualifications: string[];
  min_experience_years: number | null;
  education_level: string | null;
  languages: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  salary_frequency: string | null;
  salary_public: boolean;
  salary_negotiable: boolean;
  benefits: string[];
  working_hours: string | null;
  start_date: string | null;
  opens_at: string | null;
  closing_date: string | null;
  required_documents: DocumentType[];
  screening_questions: ScreeningQuestion[];
  application_method: 'website' | 'email' | 'external';
  application_email: string | null;
  application_url: string | null;
  application_instructions: string | null;
  recruiter_name: string | null;
  recruiter_email: string | null;
  recruiter_phone: string | null;
  status: PostingStatus;
  created_at: string;
}

export interface AdminJobPosting extends JobPosting {
  application_count: number;
}

export function formatSalary(posting: Pick<JobPosting, 'salary_min' | 'salary_max' | 'salary_currency' | 'salary_frequency' | 'salary_negotiable' | 'salary_public'>): string | null {
  if (posting.salary_negotiable) return 'Negotiable';
  if (!posting.salary_public) return null;
  if (!posting.salary_min && !posting.salary_max) return null;
  const fmt = (n: number) => n.toLocaleString('en-ZA');
  const amount =
    posting.salary_min && posting.salary_max && posting.salary_min !== posting.salary_max
      ? `${fmt(posting.salary_min)} – ${fmt(posting.salary_max)}`
      : fmt(posting.salary_min || posting.salary_max || 0);
  const suffix = posting.salary_frequency ? ` / ${posting.salary_frequency.toLowerCase()}` : '';
  return `${posting.salary_currency} ${amount}${suffix}`;
}
