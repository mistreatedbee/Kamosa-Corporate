-- Careers v2: richer job postings (category, work arrangement, salary, requirements split into
-- essential/preferred, screening questions, configurable required documents), multi-document
-- applications, application notes, and an expanded status lifecycle.
--
-- No existing data to migrate (confirmed zero real postings/applications at the time of this
-- migration) — new columns get sensible defaults so existing code paths keep working unmodified
-- until the API/UI are updated to use them.

-- job_postings: new fields.
alter table public.job_postings
  add column if not exists category text,
  add column if not exists industry text,
  add column if not exists work_arrangement text not null default 'on-site',
  add column if not exists vacancies integer not null default 1,
  add column if not exists preferred_requirements text[] not null default '{}',
  add column if not exists qualifications text[] not null default '{}',
  add column if not exists min_experience_years integer,
  add column if not exists education_level text,
  add column if not exists languages text[] not null default '{}',
  add column if not exists salary_min numeric,
  add column if not exists salary_max numeric,
  add column if not exists salary_currency text not null default 'ZAR',
  add column if not exists salary_frequency text,
  add column if not exists salary_public boolean not null default false,
  add column if not exists salary_negotiable boolean not null default false,
  add column if not exists benefits text[] not null default '{}',
  add column if not exists working_hours text,
  add column if not exists start_date date,
  add column if not exists opens_at date,
  add column if not exists required_documents text[] not null default array['cv'],
  add column if not exists screening_questions jsonb not null default '[]',
  add column if not exists application_method text not null default 'website',
  add column if not exists application_email text,
  add column if not exists application_url text,
  add column if not exists application_instructions text,
  add column if not exists recruiter_name text,
  add column if not exists recruiter_email text,
  add column if not exists recruiter_phone text;

alter table public.job_postings drop constraint if exists job_postings_work_arrangement_check;
alter table public.job_postings add constraint job_postings_work_arrangement_check
  check (work_arrangement in ('on-site', 'remote', 'hybrid'));

alter table public.job_postings drop constraint if exists job_postings_vacancies_check;
alter table public.job_postings add constraint job_postings_vacancies_check check (vacancies >= 1);

alter table public.job_postings drop constraint if exists job_postings_salary_frequency_check;
alter table public.job_postings add constraint job_postings_salary_frequency_check
  check (salary_frequency is null or salary_frequency in ('Hourly', 'Daily', 'Weekly', 'Monthly', 'Annually'));

alter table public.job_postings drop constraint if exists job_postings_required_documents_check;
alter table public.job_postings add constraint job_postings_required_documents_check
  check (required_documents <@ array['cv', 'cover_letter', 'certificates', 'portfolio', 'other']);

alter table public.job_postings drop constraint if exists job_postings_application_method_check;
alter table public.job_postings add constraint job_postings_application_method_check
  check (application_method in ('website', 'email', 'external'));

-- Expand employment_type to the full spec'd set (safe to replace outright — no existing rows).
alter table public.job_postings drop constraint if exists job_postings_employment_type_check;
alter table public.job_postings add constraint job_postings_employment_type_check
  check (employment_type in (
    'Permanent', 'Fixed-term Contract', 'Temporary', 'Part-time', 'Full-time',
    'Internship', 'Learnership', 'Freelance'
  ));

-- Expand status lifecycle: draft -> open (published) -> paused/closed -> archived.
alter table public.job_postings drop constraint if exists job_postings_status_check;
alter table public.job_postings add constraint job_postings_status_check
  check (status in ('draft', 'open', 'paused', 'closed', 'archived'));

-- job_applications: multiple documents (beyond the always-present CV), screening-question
-- answers, a human-friendly reference code, consent timestamp, and a Withdrawn status.
alter table public.job_applications
  add column if not exists documents jsonb not null default '[]',
  add column if not exists answers jsonb not null default '[]',
  add column if not exists consent_at timestamptz;

alter table public.job_applications drop column if exists reference_code;
alter table public.job_applications
  add column reference_code text generated always as ('KAM-' || upper(substr(id::text, 1, 8))) stored;

alter table public.job_applications drop constraint if exists job_applications_status_check;
alter table public.job_applications add constraint job_applications_status_check
  check (status in ('New', 'Reviewed', 'Shortlisted', 'Interviewing', 'Offered', 'Rejected', 'Hired', 'Withdrawn'));

-- Internal notes on applications — mirrors enquiry_notes exactly: service-role only, no
-- anon/authenticated policy at all (staff-only, never a public-facing write path).
create table if not exists public.job_application_notes (
  id uuid primary key default gen_random_uuid(),
  job_application_id uuid not null references public.job_applications (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists job_application_notes_application_id_idx on public.job_application_notes (job_application_id);

alter table public.job_application_notes enable row level security;

-- Allow a fifth notification type for applicant-facing status-change emails (Offered/Rejected/
-- Hired) — same email_templates table, admin-editable subject/intro, same no-op-if-unset posture.
alter table public.email_templates drop constraint if exists email_templates_type_check;
alter table public.email_templates add constraint email_templates_type_check
  check (type in ('enquiry', 'quote_request', 'service_request', 'job_application', 'application_status_update'));
